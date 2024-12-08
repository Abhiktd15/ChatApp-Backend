import { envMode } from "../app.js";

const errorMiddleware = (err,req,res,next) => {
    err.message ||= "Internal server error";
    err.statusCode ||= 500;
    if(err.code===11000){
        const error = Object.keys(err.keyPattern).join(",")
        err.statusCode = 400;
        err.message = `Duplicate filed - ${error}`
    }

    if(err.name === "CastError"){
        const errPath = err.path
        err.message = `Invalid format of path- ${errPath}`
        err.statusCode = 400;
    }
    return res.status(err.statusCode).json({
        success : false,
        message : envMode === "DEVELOPMENT" ? err : err.message
    });
};

const TryCatch = (passedFunc) => async (req, res, next) => {
        try {
            await passedFunc(req, res, next);
        } catch (error) {
            next(error);
        }
    };

export {errorMiddleware,TryCatch};