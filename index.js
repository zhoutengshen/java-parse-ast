const javaAst = require("java-parser");
const { writeFileSync } = require('fs')
const javaCodeSource = `
public enum BusinessExceptionEnum implements IError {
    CODE_ERROR(1001, "验证码错误码"),
    STATUS_ERROR(1002, "打印机状态错误码"),
    INTERRUPT_ERROR(1003, "客户端断开状态码"),
    TOKEN_CHECK_ERROR(1004, "令牌校验失败"),
    TOKEN_INVALID_ERROR(1005, "令牌已失效"),
    REPEAT_LOGIN(1006, "重复登录"),
    ORDER_STATUS_ERROR(1007, "订单状态错误"),
    PARAM_ERROR(1008, "参数错误码"),
    COMMON_ERROR(1009, "常规错误码"),
    MD5_ERROR(1010, "文件信息摘要不一致"),
    USER_ERROR(1011, "用户信息错误"),
    CLIENT_ERROR(1011, "客户端错误"),
    ERROR(500, "系统错误"),

    ;

    private int baseCode;

    private String desc;

    BusinessExceptionEnum(int baseCode, String desc) {
        this.baseCode = baseCode;
        this.desc = desc;
    }

    @Override
    public int getCode() {
        return this.baseCode;
    }

    @Override
    public String getDesc() {
        return this.desc;
    }
}

`

// 将java 枚举转换为 typescript 枚举
// 1. 提取出枚举的名称
// 2. 提取出枚举的值
// 3. 提取出枚举的注释
// 4. 将枚举转换为 typescript 的枚举

class TsEnumValue {
    constructor(name, value, desc) {
        this.name = name;
        this.value = value;
        this.desc = desc;
    }
}
class TsEnum {
    constructor(name, enumList, comment,) {
        this.name = name;
        this.comment = comment;
        this.enumList = enumList;
    }
}

class TsEnumVisitor extends javaAst.BaseJavaCstVisitorWithDefaults {
    tsEnum = null;
    constructor() {
        super();
        this.validateVisitor();
    }
    enumDeclaration (ctx) {
        const tsEnum = new TsEnum()
        this.visit(ctx.typeIdentifier, tsEnum);
        this.visit(ctx.enumBody, tsEnum)
        this.tsEnum = tsEnum;
    }
    typeIdentifier (ctx, params) {
        if (params instanceof TsEnum) {
            params.name = ctx.Identifier[0].image;
        }
    }
    enumConstantList (ctx, params) {
        if (params instanceof TsEnum) {
            // Array<TsEnumValue>
            const tsEnumListParams = [];
            ctx.enumConstant.map(item => this.visit(item, tsEnumListParams));
            params.enumList = tsEnumListParams;
        }
    }
    enumConstant (ctx, tsEnumListParams) {
        // TsEnumValue
        const name = ctx.Identifier?.[0]?.image || "";
        const tsEnum = new TsEnumValue(name);
        this.visit(ctx.argumentList, tsEnum);
        tsEnumListParams.push(tsEnum);
    }
    argumentList (ctx, tsEnum) {
        if (tsEnum instanceof TsEnumValue) {
            Array.from(ctx.expression).forEach((item, index) => {
                if (index === 0) {
                    const valObj = {
                        value: undefined,
                        isEnumParams: true
                    };
                    this.visit(item, valObj);
                    tsEnum.value = valObj.value;
                } else if (index === 1) {
                    const descObj = {
                        value: undefined,
                        isEnumParams: true
                    };
                    this.visit(item, descObj);
                    tsEnum.desc = descObj.value;
                }
            })
        }
    }
    /** 字面量 */
    literal (ctx, params) {
        if (params.isEnumParams) {
            const singleKeys = ['CharLiteral', 'TextBlock', 'StringLiteral', 'Null']
            singleKeys.forEach(key => {
                if (ctx[key]) {
                    // 删除前后的引号
                    params.value = ctx[key]?.[0]?.image?.replace(/^"|"$/g, '')
                }
            })

            if (ctx.integerLiteral) {
                this.visit(ctx.integerLiteral, params);
            }
            if (ctx.floatingPointLiteral) {
                this.visit(ctx.floatingPointLiteral, params);
            }
            if (ctx.booleanLiteral) {
                this.visit(ctx.booleanLiteral, params);
            }
        }
    }
    integerLiteral (ctx, params) {
        if (params.isEnumParams) {
            params.value = Number(ctx.DecimalLiteral[0].image)
        }
    }
    floatingPointLiteral (ctx, params) {

        if (params.isEnumParams) {
            params.value = Number(ctx.FloatLiteral[0].image)
        }
    }
    booleanLiteral (ctx, params) {
        if (params.isEnumParams) {
            const value = ctx['False']?.[0]?.image || ctx?.['True']?.[0]?.image
            params.value = value === 'true' ? true : false;
        }
    }
}
const ast = javaAst.parse(javaCodeSource);
// 将ast 转换为code
const visitor = new TsEnumVisitor()
visitor.visit(ast)

// 将tsEnum 转换为 typescript 代码
const cover2TsCode = (tsEnum) => {
    const { name, enumList, comment } = tsEnum;
    const enumListStrBody = enumList.map(item => {
        const { name, value, desc } = item;
        return `
        /**
         * ${desc}
         */
        ${name} = ${value},
        `
    }).join('\n')
    return `
    /**
     * ${comment}
     */
    export enum ${name} {
        ${enumListStrBody}
    }
    `
}
// 
const resultStr = cover2TsCode(visitor.tsEnum)
// 覆盖下写入
writeFileSync('./result.ts', resultStr)
