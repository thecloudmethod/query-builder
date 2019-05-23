import { SqlString } from './sql-string.class';

export interface QueryReplacemnets {
    [key: string]: string | number
}

export interface UpdateColumnsDynamic {
    [key: string]: string | number
}

export interface UpdateColumns {
    column: string;
    value: string | number;
}

export type QueryTypes = 'SELECT' | 'UPDATE' | 'DELETE' | 'INSERT' | 'CREATE' | 'DROP';

export type JoinTypes = 'LEFT' | 'RIGHT' | 'INNER' | 'FULL' | '';

export type Operators = '=' | '!=' | '>' | '<' | '>=' | '<=' | '<>' | 'LIKE' ;

export interface Joins {
    join_type: JoinTypes;
    table: string;
    operator: string;
    column1: string;
    column2: string;
}

export interface Wheres {
    type: 'AND' | 'OR';
    column?: string;
    operator?: string;
    value?: string | number;
    raw?: string;
}

export interface QueryConfig {
    select?: string[];
    from?: string[];
    override?: QueryConfigOverides;
}

export interface QueryConfigOverides {
    select_statement?: string;
}

export interface SequelizeSql {
    query: string;
    replacements: QueryReplacemnets;
    type: string;
}

export class Query {
    private query_type: QueryTypes;
    private select_statement: string = 'SELECT';
    private update_statement: string = 'UPDATE';
    private update_set_statement: string = 'SET';
    private updateColumns: UpdateColumns[] = [];
    private insert_statement: string = 'INSERT INTO';
    private insert_values_statement: string = 'VALUES';
    private insertColumns: string[] = [];
    private insertColumnsValues: Array<string | number> = [];
    private delete_statement: string = 'DELETE';
    private selectedColums: string[] = [];
    private from_statement: string = 'FROM';
    private fromTables: string[] = [];
    private joins: Joins[] = [];
    private join_on_statement: string = 'ON';
    private join_statement: string = 'JOIN';
    private wheres: Wheres[] = [];
    private where_statement: string = 'WHERE';
    private where_in_statement: string = 'IN';
    private groupby_statement: string = 'GROUP BY';
    private groupBys: string[] = [];
    private limit: number;
    private offset: number;
    private limit_statement: string = 'LIMIT';
    private offset_statement: string = 'OFFSET';
    private queryReplacemnets: QueryReplacemnets = {};

    constructor(congif?: QueryConfig) {

    }

    select(...args: string[]) {
        this.setQueryType('SELECT');

        for(let column of args) {
            this.setSelectValue(column);
        }
        
        return this;
    }

    update(table?: string) {
        this.setQueryType('UPDATE');

        this.setTableValue(table);
        
        return this;
    }

    insert(table?: string) {
        this.setQueryType('INSERT');

        this.setTableValue(table);
        
        return this;
    }

    items(item: UpdateColumnsDynamic) {
        if(this.query_type == 'UPDATE') {
            for(let column of Object.keys(item)) {
                const cleanValueReplacemntName = this.getReplacementName(column)
                this.setReplacementValue(cleanValueReplacemntName, item[column])

                this.setUpdateColumnsValue({
                    column: column,
                    value: ':'+cleanValueReplacemntName
                })
            }
        }

        if(this.query_type == 'INSERT') {
            for(let column of Object.keys(item)) {
                const cleanValueReplacemntName = this.getReplacementName(column)
                this.setReplacementValue(cleanValueReplacemntName, item[column])

                this.setInsertColumnsValue({
                    column: column,
                    value: ':'+cleanValueReplacemntName
                })
            }
        }
    }

    selectRaw(select: string) {
        this.setQueryType('SELECT');

        this.setSelectValue(select);
        
        console.log(this);
        return this;
    }

    table(...args: string[]) {
        for(let table of args) {
            this.setTableValue(table);
        }
        
        return this;
    }

    leftJoin(table: string, column1: string, cloumn2:string, operator?: string) {
        let defaultOpporator = '='

        this.setJoin({
            join_type: 'LEFT',
            table: this.escapeSql(table),
            column1: this.escapeSql(column1),
            column2: this.escapeSql(cloumn2),
            operator: operator? operator : defaultOpporator
        })

        return this;
    }

    rightJoin(table: string, column1: string, cloumn2:string, operator?: string) {
        let defaultOpporator = '='

        this.setJoin({
            join_type: 'RIGHT',
            table: this.escapeSql(table),
            column1: this.escapeSql(column1),
            column2: this.escapeSql(cloumn2),
            operator: operator? operator : defaultOpporator
        })

        return this;
    }

    join(table: string, column1: string, cloumn2:string, operator?: string) {
        let defaultOpporator = '='

        this.setJoin({
            join_type: '',
            table: this.escapeSql(table),
            column1: this.escapeSql(column1),
            column2: this.escapeSql(cloumn2),
            operator: operator? operator : defaultOpporator
        })

        return this;
    }

    innerJoin(table: string, column1: string, cloumn2:string, operator?: string) {
        let defaultOpporator = '='

        this.setJoin({
            join_type: 'INNER',
            table: this.escapeSql(table),
            column1: this.escapeSql(column1),
            column2: this.escapeSql(cloumn2),
            operator: operator? operator : defaultOpporator
        })

        return this;
    }

    where(...args) {
        if(args.length == 2) {
            const cleanValue = this.getReplacementName(args[0])
            this.setReplacementValue(cleanValue, args[1])

            this.setWhere({
                type: 'AND',
                column: this.escapeSql(args[0]),
                operator: '=',
                value: ':'+cleanValue
            })
        }

        if(args.length == 3) {
            const cleanValue = this.getReplacementName(args[0])
            this.setReplacementValue(cleanValue, args[2])

            this.setWhere({
                type: 'AND',
                column: this.escapeSql(args[0]),
                operator: this.escapeSql(args[1]),
                value: ':'+cleanValue
            })
        }

        return this;
    }

    orWhere(...args) {        

        if(args.length == 2) {
            const cleanValue = this.getReplacementName(args[0])
            this.setReplacementValue(cleanValue, args[1])

            this.setWhere({
                type: 'OR',
                column: this.escapeSql(args[0]),
                operator: '=',
                value: ':'+cleanValue
            })
        }

        if(args.length == 3) {
            const cleanValue = this.getReplacementName(args[0])
            this.setReplacementValue(cleanValue, args[2])

            this.setWhere({
                type: 'OR',
                column: this.escapeSql(args[0]),
                operator: this.escapeSql(args[1]),
                value: ':'+cleanValue
            })
        }

        return this;
    }

    whereRaw(pre: string, values: Array<number | string>) {
         this.setWhere({
            type: 'AND',
            raw: this.whereRawReplace('?', pre, values)
        });
        
        return this;  
    }

    orWhereRaw(pre: string, values: Array<number | string>) {
        this.setWhere({
           type: 'OR',
           raw: this.whereRawReplace('?', pre, values)
       });
        
       return this;    
    }

    whereIn(column: string, matchValues: Array<string | number>) {

        const replacementName = this.getReplacementName(column);
        const cleanValues: Array<string | number> = this.escapeArraySql(matchValues);

        const setValue: string = '('+cleanValues.toString()+')'

        this.setReplacementValue(replacementName, setValue)

        this.setWhere({
            type: 'AND',
            column: this.escapeSql(column),
            operator: 'IN',
            value: ':'+replacementName
        })

        return this;
    }

    whereRawReplace(needle: string, haystack: string, fillData: Array<number | string>,  index: number = 0): string {
        const cleanValue = this.getReplacementName('where'+index)
        this.setReplacementValue(cleanValue, fillData[index])

        const newHastack = haystack.replace(needle, ':'+cleanValue);
        if(fillData.length > (index+1)) {
            let nextIndex: number = index+1;
            return this.whereRawReplace(needle, newHastack, fillData, nextIndex);
        } else {
            return newHastack    
        }
        
    }

    groupBy(...args: string[]) {
        for(let groupIdentity of args) {
            this.setGroupByValue(groupIdentity);
        }
        
        return this;
    }

    paginate(perpage: number, page: number = 1) {
        if(page <= 1) {
            this.limit = perpage;
        } else {
            this.limit = perpage;
            this.offset = (page -1)*perpage;
        }
    }

    sql(): string {
        // Minimum requirements met
        if(this.validateRequiredAttributes()) {
            if(this.query_type == 'SELECT') {
                let query = this.select_statement+' '+this.selectedColums.toString()+' '+this.from_statement+' '+this.fromTables.toString();

                if(this.join.length > 0) {
                    query = query+' '+this.generateJoinSql();
                }

                if(this.wheres.length > 0) {
                    query = query+' '+this.generateWhereSql();
                }

                if(this.groupBys.length > 0) {
                    query = query+' '+this.groupby_statement+' '+this.groupBys.toString();
                }

                if(this.limit) {
                    query = query+' '+this.limit_statement+' '+this.limit;
                }

                if(this.offset) {
                    return query+' '+this.offset_statement+' '+this.offset;
                } else {
                    return query;
                }
            }

            if(this.query_type == 'UPDATE') {
                let query = this.update_statement+' '+this.fromTables.toString()+this.update_set_statement+' ';

                query = query+' '+this.generateUpdateSetValues()+' '+this.generateWhereSql();

                return query;
            }

            if(this.query_type == 'INSERT') {
        
                let query = this.insert_statement+' '+this.fromTables.toString()+' ';

                query = query+' ('+this.insertColumns.toString()+') '+this.insert_values_statement+' ('+this.insertColumnsValues.toString()+') ';

                return query;
            }

            if(this.query_type == 'DELETE') {
                let query = this.delete_statement+' '+this.from_statement+' '+this.fromTables.toString()+' ';

                query = query+' '+this.generateWhereSql()

                return query;
            }
        } 
    }

    sequelizeSql(): SequelizeSql {
        // Minimum requirements met
        return { 
            query: this.sql(),
            replacements: this.queryReplacemnets,
            type: this.query_type
        };
    }

    validateRequiredAttributes(): boolean {
        // Verify there is a query type
        if(!this.query_type) {
            return false;
        }

        // If query type SELECT verify minimum requirements
        if(this.query_type == 'SELECT') {
            return this.selectedColums.length > 0 && this.fromTables.length > 0;
        }

        if(this.query_type == 'UPDATE') {
            return this.updateColumns.length > 0 && this.fromTables.length == 1 && this.wheres.length > 0;
        }

        if(this.query_type == 'INSERT') {
            return this.insertColumns.length > 0 && this.insertColumnsValues.length > 0 && this.fromTables.length == 1;
        }

        if(this.query_type == 'DELETE') {
            return this.wheres.length > 0 && this.fromTables.length == 1;
        }

        

    }

    private generateJoinSql(): string {
        let joinSql: string = '';

        for(let join of this.joins) {
            joinSql = join.join_type+' '+this.join_statement+' '+join.table+' '+this.join_on_statement+' '+join.column1+' '+join.operator+' '+join.column2+' ';
        }

        return joinSql;
    }

    private generateWhereSql(): string {
        let whereSql: string = '';

        this.wheres.forEach((where, index) => {
            if(index == 0) {
                if(where.raw) {
                    whereSql = this.where_statement+' '+where.raw;
                } else {
                    whereSql = this.where_statement+' '+where.column+' '+where.operator+' '+where.value+' ';
                }
            } else {
                if(where.raw) {
                    whereSql = whereSql + where.type+' '+where.raw+' ';
                } else {
                    whereSql = whereSql + where.type+' '+where.column+' '+where.operator+' '+where.value+' ';
                }
            }            
        });

        return whereSql;
    }

    private generateUpdateSetValues(): string {
        let setSql: string = '';

        this.updateColumns.forEach((where, index) => {
            setSql = setSql + where.column+' = '+where.value+' ';           
        });

        return setSql;
    }

    private escapeArraySql(matchValues: Array<string | number>): Array<string | number> {

        let cleanValues: Array<string | number> = [];

        for(let inValues of matchValues) {
            cleanValues.push(this.escapeSql(inValues))
        }
        return cleanValues;
    }

    private escapeSql(sql: string | number) {
        return SqlString.escape(sql).replace(/'/g, '');
    }

    private getReplacementName(item: string) {
        if(this.queryReplacemnets[item]) {
            return this.getReplacementName(item+'i');
        } else {
            return item;
        }
    }

    private setReplacementValue(replacement: string, mappedValue: string | number) {
        this.queryReplacemnets[replacement] = mappedValue;    
    }

    private setSelectValue(replacement: string) {
        this.selectedColums = this.selectedColums.concat(this.escapeSql(replacement));    
    }

    private setInsertColumnsValue(column: UpdateColumns) {
        this.insertColumns = this.insertColumns.concat(column.column);
        this.insertColumnsValues = this.insertColumnsValues.concat(column.value);  
    }

    private setUpdateColumnsValue(column: UpdateColumns) {
        this.updateColumns = this.updateColumns.concat(column);    
    }

    private setGroupByValue(replacement: string) {
        this.groupBys = this.groupBys.concat(this.escapeSql(replacement));    
    }

    private setTableValue(replacement: string) {
        this.fromTables = this.fromTables.concat(this.escapeSql(replacement));    
    }

    private setWhere(where: Wheres) {
        this.wheres = this.wheres.concat(where);    
    }

    private setJoin(join: Joins) {
        this.joins = this.joins.concat(join);    
    }

    private setQueryType(type: QueryTypes) {
        if(!this.query_type) {
            this.query_type = type;
        }
    }

    private checkInit() {
    }
}