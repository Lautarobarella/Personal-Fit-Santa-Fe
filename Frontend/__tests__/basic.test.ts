describe('Basic Test Suite', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle strings', () => {
    expect('hello').toBe('hello')
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj.name).toBe('test')
    expect(obj.value).toBe(42)
  })
}) 