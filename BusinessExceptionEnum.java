package com.wygtech.yunyin.enums;

import com.wygtech.common.enums.error.IError;

/**
 * @author liquanlin
 * @date 2023/7/3
 **/
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
