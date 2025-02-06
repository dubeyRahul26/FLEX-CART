
// import statements
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { generateTokens, storeRefreshToken } from "../utils/tokenUtils.js";
import { setCookies } from "../utils/cokieeUtils.js";
import { redis } from "../lib/redis.js";

// SignUp function implementation
export const signup = async (req, res) => {
  // getting hold of email , password and name from the request body
  const { email, password, name } = req.body;

  // implementing try-catch for error handling
  try {
    // finding if the email is already in use
    const userExists = await User.findOne({ email });

    // checking if we already have a user with that email we return the message : "User already exists"
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    // if the email is not present we create a new user with that email and hash the password before saving it to DB
    const user = await User.create({ name, email, password });

    // authenticate the user and generate access and refresh tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // storing the referesh token in redis for faster access
    await storeRefreshToken(user._id, refreshToken);

    // setting the refresh token and access token to the user's browser for storing user preferences and authentication information
    setCookies(res, accessToken, refreshToken);

    // sending response back to the client with created user details to be handled at client side
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // catch the error and return the error response back to the client to  be handled at client side and enhance the UX
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Implementing the login controller
export const login = async (req, res) => {
  // implementing try-catch for error handling
  try {
    // extracting the email and password from the request body
    const { email, password } = req.body;

    // finding the user in the database with the given email
    const user = await User.findOne({ email });

    // if user is found and password is also correct then the if block is executed
    if (user && (await user.comparePassword(password))) {
      // generating access and refresh tokens with the use jwt and using the payload as the user's id
      const { accessToken, refreshToken } = generateTokens(user._id);

      // storing the refresh token in the redis cache for faster access
      await storeRefreshToken(user._id, refreshToken);

      // setting the refresh token and access token in the cookies for the user's browser which would be used for authentication and authorization
      setCookies(res, accessToken, refreshToken);

      // sending the user details back to the client for frontend purposes
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
      // email or passwrod is not correct we return the response with message: "Invalid email or password"
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
    // catch the error and return the error response back to the client to  be handled at client side and enhance the UX
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Implementing the logout controller
export const logout = async (req, res) => {
  // implementing try-catch for error handling
  try {
    // getting hold of the refresh token from the cookies
    const refreshToken = req.cookies.refreshToken;

    // if the refresh token is found
    if (refreshToken) {
      // decoding the refresh token for authentication purposes
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      // if the decoded token is found then delete the refresh token from the redis cache
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    // clearing the refresh token and access token from the cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // sending back the logout message response to the client
    res.status(200).json({ message: "Logged out successfully" });

    // handling the error's that could occur because of the code in the try block or internal server error
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// handler for refresh acess token 
export const refreshAccessToken = async (req, res) => {

  // implementing try-catch for error handling
  try {
    // getting the refresh token from the cookies
    const refreshToken = req.cookies.refreshToken;

    // if the refresh token is not provided then simply return the below response
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // if the refresh token is provided then we decode it (ie. whether it is valid or not)
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    // now we need to find the same token in the redis cache 
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    // if the refresh token recieved by the client and the one present in the cache are not the same then we return the error response
    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    // now we create the new access token  as the recieved refresh token was valid
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // sending back the new access token within the cookie to the client's browser
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    // response message of successful token refresh
    res.json({ message: "Token refreshed successfully" });

    // handling any server error's
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};