var ID_GLOBAL_REGEXP    = /`/g;
var QUAL_GLOBAL_REGEXP  = /\./g;
var CHARS_GLOBAL_REGEXP = /[\0\b\t\n\r\x1a\"\'\\]/g; // eslint-disable-line no-control-regex
var CHARS_ESCAPE_MAP    = {
  '\0'   : '\\0',
  '\b'   : '\\b',
  '\t'   : '\\t',
  '\n'   : '\\n',
  '\r'   : '\\r',
  '\x1a' : '\\Z',
  '"'    : '\\"',
  '\''   : '\\\'',
  '\\'   : '\\\\'
};

export class SqlString {

    public static escapeId(val, forbidQualified?) {
        if (Array.isArray(val)) {
            var sql = '';
        
            for (var i = 0; i < val.length; i++) {
            sql += (i === 0 ? '' : ', ') + SqlString.escapeId(val[i], forbidQualified);
            }
        
            return sql;
        } else if (forbidQualified) {
            return '`' + String(val).replace(ID_GLOBAL_REGEXP, '``') + '`';
        } else {
            return '`' + String(val).replace(ID_GLOBAL_REGEXP, '``').replace(QUAL_GLOBAL_REGEXP, '`.`') + '`';
        }
    };

    public static escape(val, stringifyObjects?, timeZone?) {
        if (val === undefined || val === null) {
            return 'NULL';
        }
      
        switch (typeof val) {
            case 'boolean': return (val) ? 'true' : 'false';
            case 'number': return val + '';
            case 'object':
            if (val instanceof Date) {
                return SqlString.dateToString(val, timeZone || 'local');
            } else if (Array.isArray(val)) {
                return SqlString.arrayToList(val, timeZone);
            } else if (typeof val.toSqlString === 'function') {
                return String(val.toSqlString());
            } else if (stringifyObjects) {
                return SqlString.escapeString(val.toString());
            } else {
                return SqlString.objectToValues(val, timeZone);
            }
            default: return SqlString.escapeString(val);
        }
    };

    public static arrayToList(array, timeZone) {
        var sql = '';
      
        for (var i = 0; i < array.length; i++) {
          var val = array[i];
      
          if (Array.isArray(val)) {
            sql += (i === 0 ? '' : ', ') + '(' + SqlString.arrayToList(val, timeZone) + ')';
          } else {
            sql += (i === 0 ? '' : ', ') + SqlString.escape(val, true, timeZone);
          }
        }
      
        return sql;
      };

    public static format(sql, values, stringifyObjects, timeZone) {
        if (values == null) {
          return sql;
        }
      
        if (!(values instanceof Array || Array.isArray(values))) {
          values = [values];
        }
      
        var chunkIndex        = 0;
        var placeholdersRegex = /\?+/g;
        var result            = '';
        var valuesIndex       = 0;
        var match;
      
        while (valuesIndex < values.length && (match = placeholdersRegex.exec(sql))) {
          var len = match[0].length;
      
          if (len > 2) {
            continue;
          }
      
          var value = len === 2
            ? SqlString.escapeId(values[valuesIndex])
            : SqlString.escape(values[valuesIndex], stringifyObjects, timeZone);
      
          result += sql.slice(chunkIndex, match.index) + value;
          chunkIndex = placeholdersRegex.lastIndex;
          valuesIndex++;
        }
      
        if (chunkIndex === 0) {
          // Nothing was replaced
          return sql;
        }
      
        if (chunkIndex < sql.length) {
          return result + sql.slice(chunkIndex);
        }
      
        return result;
      };

    public static dateToString(date, timeZone) {
        var dt = new Date(date);
      
        if (isNaN(dt.getTime())) {
          return 'NULL';
        }
      
        var year;
        var month;
        var day;
        var hour;
        var minute;
        var second;
        var millisecond;
      
        if (timeZone === 'local') {
          year        = dt.getFullYear();
          month       = dt.getMonth() + 1;
          day         = dt.getDate();
          hour        = dt.getHours();
          minute      = dt.getMinutes();
          second      = dt.getSeconds();
          millisecond = dt.getMilliseconds();
        } else {
          var tz = SqlString.convertTimezone(timeZone);
      
          if (tz !== false && tz !== 0) {
            dt.setTime(dt.getTime() + (tz * 60000));
          }
      
          year       = dt.getUTCFullYear();
          month       = dt.getUTCMonth() + 1;
          day         = dt.getUTCDate();
          hour        = dt.getUTCHours();
          minute      = dt.getUTCMinutes();
          second      = dt.getUTCSeconds();
          millisecond = dt.getUTCMilliseconds();
        }
      
        // YYYY-MM-DD HH:mm:ss.mmm
        var str = SqlString.zeroPad(year, 4) + '-' + SqlString.zeroPad(month, 2) + '-' + SqlString.zeroPad(day, 2) + ' ' +
        SqlString.zeroPad(hour, 2) + ':' + SqlString.zeroPad(minute, 2) + ':' + SqlString.zeroPad(second, 2) + '.' +
        SqlString.zeroPad(millisecond, 3);
      
        return SqlString.escapeString(str);
      };

    public static bufferToString(buffer) {
        return 'X' + SqlString.escapeString(buffer.toString('hex'));
      };

    public static objectToValues(object, timeZone) {
        var sql = '';
      
        for (var key in object) {
          var val = object[key];
      
          if (typeof val === 'function') {
            continue;
          }
      
          sql += (sql.length === 0 ? '' : ', ') + SqlString.escapeId(key) + ' = ' + SqlString.escape(val, true, timeZone);
        }
      
        return sql;
      };

    public static raw(sql) {
        if (typeof sql !== 'string') {
          throw new TypeError('argument sql must be a string');
        }
      
        return {
          toSqlString: function toSqlString() { return sql; }
        };
      };

    public static escapeString(val) {
        var chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex = 0;
        var escapedVal = '';
        var match;
      
        while ((match = CHARS_GLOBAL_REGEXP.exec(val))) {
          escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
          chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex;
        }
      
        if (chunkIndex === 0) {
          // Nothing was escaped
          return "'" + val + "'";
        }
      
        if (chunkIndex < val.length) {
          return "'" + escapedVal + val.slice(chunkIndex) + "'";
        }
      
        return "'" + escapedVal + "'";
      }

    public static zeroPad(number, length) {
        number = number.toString();
        while (number.length < length) {
          number = '0' + number;
        }
      
        return number;
      }

    public static convertTimezone(tz) {
        if (tz === 'Z') {
          return 0;
        }
      
        var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
        if (m) {
          return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
        }
        return false;
      }
    
}