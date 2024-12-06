import {body,check,param,query,validationResult} from "express-validator"
import { ErrorHandler } from "../utils/utility.js"
const validateHandler = (req,res,next) => {
    const errors = validationResult(req)
    const errorMessages  = errors.array().map((err) => err.msg).join(", ")

    console.log(errorMessages)
    if(errors.isEmpty())
        return next();
    else 
        next(new ErrorHandler(errorMessages,400))
}

const registerValidator = () => [
    body("name","Please Enter Name").notEmpty(),
    body("username","Please Enter USername").notEmpty(),
    body("bio","Please Enter Bio").notEmpty(),
    body("password","Please Enter Password").notEmpty(),
    // check("avatar","Please Enter Avatar").notEmpty(),
]
const validateLogin = () => [
    body("username","Please Enter USername").notEmpty(),
    body("password","Please Enter Password").notEmpty()
]
const newGroupValidator = () => [
    body("name","Please Enter Name").notEmpty(),
    body("members").notEmpty().withMessage("Please enter members")
    .isArray({min:2,max:100}).withMessage("Members must be between 2 and 100 ")
]
const addMemberValidator = () => [
    body("chatId","Please Enter ChatId").notEmpty(),
    body("members").notEmpty().withMessage("Please enter members")
    .isArray({min:1,max:97}).withMessage("Members must be atleast 1-97")
]
const removeMemberValidtor = () => [
    body("chatId","Please Enter ChatId").notEmpty(),
    body("userId","Please Enter UserID").notEmpty(),
]

const sendAttachementsValidator = () => [
    body("chatId","Please Enter ChatId").notEmpty(),
    check("files").notEmpty().withMessage("please upload attachments")
    .isArray({min:1,max:5}).withMessage("Attachments must be between 1 and 5")
]
const chatIdValidator= () => [
    param("id","Please Enter ChatId").notEmpty(),
]
const renameGroupValidator= () => [
    param("id","Please Enter ChatId").notEmpty(),
    body("name","Please Enter name").notEmpty(),
]
const sendRequestValidator= () => [
    body("userId","Please Enter UserId").notEmpty(),
]
const acceptRequestValidator= () => [
    body("requestId","Please Enter Request Id").notEmpty(),
    body("accept").notEmpty().withMessage("Please Add Accept").isBoolean().withMessage("Accept must be a boolean"),
]


export {
    registerValidator,
    validateHandler,
    validateLogin,
    newGroupValidator,
    addMemberValidator,
    removeMemberValidtor,
    sendAttachementsValidator,
    chatIdValidator,
    renameGroupValidator,
    sendRequestValidator,
    acceptRequestValidator
}