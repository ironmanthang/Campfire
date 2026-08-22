**Câu 47 - 49** Cho các lớp AST, một số lớp hỗ trợ và một phần định nghĩa của lớp CodeGenerator như dưới đây. Giả sử Program được sinh mã thành phương thức main và các biến trở thành biến cục bộ của phương thức này. Các vị trí cần hoàn thiện trong CodeGenerator được ký hiệu từ (1) đến (9).  
Sử dụng các quy ước sau cho các phương thức của lớp Emitter:
- `emitINITARRAY(name, idx, type, frame)`: sinh mã tạo dãy và gán cho biến ở idx.
- `emitVAR(index, name, type, start, end, frame)`: sinh mã cho biến name tại index, kiểu type, hiệu lực từ start đến end.
- `emitREADVAR(name, type, index, frame)`: nạp giá trị biến tại index lên ngăn xếp.
- `emitWRITEVAR(name, type, index, frame)`: ghi giá trị ở đỉnh ngăn xếp vào biến tại index.
- `emitALOAD(type, frame)` / `emitASTORE(type, frame)`: sinh xaload / xastore với x tùy type.
- Kiểu các tham số `name`, `idx`, `type`, `frame`, `index`, `start`, `end` lần lượt là `str`, `Index`, `Type`, `Frame`, `int`, `int`, `int`.

```python
class AST(ABC):              # abstract
class Type(AST):             # abstract
class Exp(AST):              # abstract
class Program(AST):          # decls: List[VarDecl], stmts: List[Assign]
class VarDecl(AST):          # name: str, var_type: Type
class Assign(AST):           # lhs: Exp, rhs: Exp
class Id(Exp):               # name: str
class ArrayCell(Exp):        # arr: Exp, idx: List[Exp]
class IntLit(Exp):           # val: int
class ArrayType(Type):       # eleType: Type, dimen: List[int]
class IntType(Type):
    pass
class Symbol:                # name: str, typ: Type, value: Index
class Index:                 # value: int
class Access:                # sym: List[Symbol], isLeft: bool, isFirst: bool,
                             # ltype: Type, frame: Frame

class CodeGenerator(Visitor):
    def visitProgram(self, ast, o):
        # Code unrelated to the numbered positions has been removed
        env = reduce(lambda acc, x: self.visit(x, acc), ast.decls,
                     {"env": [], "frame": frame})
        [self.emit.printout(__(1)__) for x in env['env']
         if type(x.typ) == ArrayType]
        # Code unrelated to the numbered positions has been removed
        [self.visit(x, env) for x in ast.stmts]
        # Code unrelated to the numbered positions has been removed

    def visitVarDecl(self, ast, c):
        frame = c["frame"]
        idx = frame.getNewIndex()
        self.emit.printout(__(2)__)
        __(3)__
        return c

    def visitAssign(self, ast, c):
        env, frame = c["env"], c["frame"]
        lhs = self.visit(ast.lhs, Access(env, True, True, None, frame))
        rhs = self.visit(ast.rhs, Access(env, False, False, None, frame))
        lhs2 = self.visit(ast.lhs, Access(env, True, False, lhs[1], frame))
        self.emit.printout(__(4)__)
        return c

    def visitId(self, ast, c):
        env, frame, isLeft, isFirst = c.sym, c.frame, c.isLeft, c.isFirst
        res = ""
        sym = next(filter(lambda x: x.name == ast.name, env), None)
        if isFirst:
            return __(5)__
        if isLeft:
            res = self.emit.emitWRITEVAR(ast.name, sym.typ,
                                         sym.value.value, frame), sym.typ
        else:
            res = __(6)__
        return res

    def visitArrayCell(self, ast, c):
        env, frame, isLeft, isFirst = c.sym, c.frame, c.isLeft, c.isFirst
        res = ""
        if isFirst or not isLeft:
            arr = self.visit(ast.arr, Access(env, False, False, None, frame))
            icode = reduce(
                lambda a, x: __(7)__ + self.emit.emitALOAD(arr[1], frame),
                ast.idx[:-1], "")
            icode += self.visit(
                ast.idx[-1], Access(env, False, False, None, frame))[0]
            res = arr[0] + icode, arr[1].eleType
        if not isLeft:
            res = __(8)__
        __(9)__:
            res = self.emit.emitASTORE(c.ltype, frame), c.ltype
        return res
```

**Câu 47. (L.O.3.2): (1 điểm):** Chọn đoạn mã thích hợp cho chỗ trống (7):
- **A.** `a + self.visit(x, Access(env, False, False, None, frame))`
- **B.** `a + self.visit(x, Access(env, False, False, None, frame))[0]`
- **C.** `self.visit(x, Access(env, False, False, None, frame))`
- **D.** `a[0] + self.visit(x, Access(env, False, False, None, frame))`

**Câu 48. (L.O.3.2): (1 điểm):** Chọn đoạn mã thích hợp cho chỗ trống (8):
- **A.** `self.emit.emitALOAD(res[1], frame), res[1]`
- **B.** `res[0] + self.emit.emitALOAD(c.ltype, frame), c.ltype`
- **C.** `self.emit.emitALOAD(c.ltype, frame), c.ltype`
- **D.** `res[0] + self.emit.emitALOAD(res[1], frame), res[1]`

**Câu 49. (L.O.3.2): (1 điểm):** Chọn đoạn mã thích hợp cho chỗ trống (9):
- **A.** `elif not isFirst`
- **B.** `elif isFirst`
- **C.** `elif isLeft and isFirst`
- **D.** `else`
