package sqlbuilder

import (
	"strings"
)

type updateSet struct {
	col string
	arg interface{}
	raw bool
}

// UpdateStatement represents an UPDATE statement.
type UpdateStatement struct {
	dbms   DBMS
	table  string
	sets   []updateSet
	wheres []where
	args   []interface{}
}

// Table returns a new statement with the table to update set to 'table'.
func (s UpdateStatement) Table(table string) UpdateStatement {
	s.table = table
	return s
}

// Set returns a new statement with column 'col' set to value 'val'.
func (s UpdateStatement) Set(col string, val interface{}) UpdateStatement {
	s.sets = append(s.sets, updateSet{col: col, arg: val, raw: false})
	return s
}

// SetSQL returns a new statement with column 'col' set to SQL expression 'sql'.
func (s UpdateStatement) SetSQL(col string, sql string) UpdateStatement {
	s.sets = append(s.sets, updateSet{col: col, arg: sql, raw: true})
	return s
}

// Where returns a new statement with condition 'cond'.
// Multiple Where() are combined with AND.
func (s UpdateStatement) Where(cond string, args ...interface{}) UpdateStatement {
	s.wheres = append(s.wheres, where{cond, args})
	return s
}

// Build builds the SQL query. It returns the query and the argument slice.
func (s UpdateStatement) Build() (query string, args []interface{}) {
	if len(s.sets) == 0 {
		panic("sqlbuilder: no columns set")
	}

	query = "UPDATE " + s.dbms.Quote(s.table) + " SET "
	var sets []string
	idx := 0

	for _, set := range s.sets {
		var arg string
		if set.raw {
			arg = set.arg.(string)
		} else {
			arg = s.dbms.Placeholder(idx)
			idx++
			args = append(args, set.arg)
		}
		sets = append(sets, s.dbms.Quote(set.col)+" = "+arg)
	}
	query += strings.Join(sets, ", ")

	if len(s.wheres) > 0 {
		var sqls []string

		for _, w := range s.wheres {
			sql := "(" + w.sql + ")"
			for _, arg := range w.args {
				p := s.dbms.Placeholder(idx)
				idx++
				sql = strings.Replace(sql, "?", p, 1)
				sqls = append(sqls, sql)
				args = append(args, arg)
			}
		}

		query += " WHERE " + strings.Join(sqls, " AND ")
	}

	return
}