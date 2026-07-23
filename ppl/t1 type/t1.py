class StaticCheck(Visitor):
    def visitBinOp(self, ctx, o):
        t1 = ctx.e1.accept(self, o)
        t2 = ctx.e2.accept(self, o)
        t1 = self.visit(ctx.e1, o)
        t2 = self.visit(ctx.e2, o)
        op = ctx.op

        if op in ('+', '-', '*'):
            if isinstance(t1, (IntType, FloatType)) and isinstance(t2, (IntType, FloatType)):
                return FloatType() if isinstance(t1, FloatType) or isinstance(t2, FloatType) else IntType()
            raise TypeMismatchInExpression(ctx)

        if op == '/':
            if isinstance(t1, (IntType, FloatType)) and isinstance(t2, (IntType, FloatType)):
                return FloatType()
            raise TypeMismatchInExpression(ctx)

        if op in ('>', '<', '>=', '<=', '==', '!='):
            if isinstance(t1, (IntType, FloatType)) and isinstance(t2, (IntType, FloatType)):
                return BoolType()
            raise TypeMismatchInExpression(ctx)

        if op in ('&&', '||'):
            if isinstance(t1, BoolType) and isinstance(t2, BoolType):
                return BoolType()
            raise TypeMismatchInExpression(ctx)

        raise TypeMismatchInExpression(ctx)

    def visitUnOp(self, ctx, o):
        t = ctx.e.accept(self, o)
        op = ctx.op

        if op == '!':
            if isinstance(t, BoolType):
                return BoolType()
            raise TypeMismatchInExpression(ctx)

        if op == '-':
            if isinstance(t, (IntType, FloatType)):
                return t
            raise TypeMismatchInExpression(ctx)

        raise TypeMismatchInExpression(ctx)

    def visitIntLit(self, ctx, o):
        return IntType()

    def visitFloatLit(self, ctx, o):
        return FloatType()

    def visitBoolLit(self, ctx, o):
        return BoolType()