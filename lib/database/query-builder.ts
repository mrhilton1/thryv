type WhereOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'like' | 'contains'

interface WhereClause<T> {
  field: keyof T
  operator: WhereOperator
  value: any
}

interface JoinClause {
  table: string
  localKey: string
  foreignKey: string
  type: 'inner' | 'left' | 'right'
}

interface OrderClause<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

export class QueryBuilder<T> {
  private data: T[]
  private whereClauses: WhereClause<T>[] = []
  private joinClauses: JoinClause[] = []
  private orderClauses: OrderClause<T>[] = []
  private limitValue?: number
  private offsetValue?: number

  constructor(data: T[]) {
    this.data = [...data]
  }

  where(field: keyof T, operator: WhereOperator, value: any): QueryBuilder<T> {
    this.whereClauses.push({ field, operator, value })
    return this
  }

  whereIn(field: keyof T, values: any[]): QueryBuilder<T> {
    return this.where(field, 'in', values)
  }

  whereLike(field: keyof T, value: string): QueryBuilder<T> {
    return this.where(field, 'like', value)
  }

  whereContains(field: keyof T, value: string): QueryBuilder<T> {
    return this.where(field, 'contains', value)
  }

  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    this.orderClauses.push({ field, direction })
    return this
  }

  limit(count: number): QueryBuilder<T> {
    this.limitValue = count
    return this
  }

  offset(count: number): QueryBuilder<T> {
    this.offsetValue = count
    return this
  }

  private applyWhere(items: T[]): T[] {
    return items.filter(item => {
      return this.whereClauses.every(clause => {
        const fieldValue = item[clause.field]
        
        switch (clause.operator) {
          case '=':
            return fieldValue === clause.value
          case '!=':
            return fieldValue !== clause.value
          case '>':
            return fieldValue > clause.value
          case '<':
            return fieldValue < clause.value
          case '>=':
            return fieldValue >= clause.value
          case '<=':
            return fieldValue <= clause.value
          case 'in':
            return Array.isArray(clause.value) && clause.value.includes(fieldValue)
          case 'like':
            return String(fieldValue).toLowerCase().includes(String(clause.value).toLowerCase())
          case 'contains':
            if (Array.isArray(fieldValue)) {
              return fieldValue.some(v => String(v).toLowerCase().includes(String(clause.value).toLowerCase()))
            }
            return String(fieldValue).toLowerCase().includes(String(clause.value).toLowerCase())
          default:
            return true
        }
      })
    })
  }

  private applyOrder(items: T[]): T[] {
    if (this.orderClauses.length === 0) return items

    return items.sort((a, b) => {
      for (const clause of this.orderClauses) {
        const aValue = a[clause.field]
        const bValue = b[clause.field]
        
        let comparison = 0
        if (aValue < bValue) comparison = -1
        else if (aValue > bValue) comparison = 1
        
        if (comparison !== 0) {
          return clause.direction === 'desc' ? -comparison : comparison
        }
      }
      return 0
    })
  }

  private applyLimitOffset(items: T[]): T[] {
    let result = items
    
    if (this.offsetValue) {
      result = result.slice(this.offsetValue)
    }
    
    if (this.limitValue) {
      result = result.slice(0, this.limitValue)
    }
    
    return result
  }

  get(): T[] {
    let result = [...this.data]
    
    result = this.applyWhere(result)
    result = this.applyOrder(result)
    result = this.applyLimitOffset(result)
    
    return result
  }

  first(): T | null {
    const results = this.limit(1).get()
    return results.length > 0 ? results[0] : null
  }

  count(): number {
    return this.applyWhere(this.data).length
  }

  pluck(field: keyof T): any[] {
    return this.get().map(item => item[field])
  }

  groupBy(field: keyof T): Record<string, T[]> {
    const items = this.get()
    const groups: Record<string, T[]> = {}
    
    items.forEach(item => {
      const key = String(item[field])
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    
    return groups
  }
}
