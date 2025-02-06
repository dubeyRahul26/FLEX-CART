// import statements
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// creating a user Schema using mongoose Schema constructor
const userSchema = new mongoose.Schema(
  // defining the fields(key) and values(of different datatypes and other options ae well like validation , default values , required etc. ) of the schema
  {
    name: {
      type: String, // name should be of type string
      required: [true, "Name is required"], // name is a required field and if not present then error message : Name is required is sent back as response to the server
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // email should be unique
      lowercase: true, 
      trim: true, // trim whitespaces from email
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"], // password must be at least 6 characters long
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1, // default value of any item added to cart will be 1
        },
        product: {
          type: mongoose.Schema.Types.ObjectId, // acts as a foreign key
          ref: "Product", // product field takes refernce from the Product schema
        },
      },
    ],
    role: {
      type: String,
      enum: ["admin", "customer"], // only the admin role or customer role is allowed for a single user
      default: "customer", // default role is a customer role
    },
  },
  { timestamps: true } // adds the createdAt and updatedAt fields in the DB
);

// pre("save") hook is used to hash the password before saving it to the database
userSchema.pre("save", async function (next) {

  /* if the password field has been modified before saving the user data to the database just return the control to the next middleware if any */
  if (!this.isModified("password")) {
    return next();
  }
  
  // If the password field has been modified, the code continues to hash the password and passes it to the next middleware
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch(error) {
    next(error);
  }
});


// This method is used to compare a plain text password input by a user with the hashed password stored in the database for a specific user. 
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Creating User model using mongoose.model() function by the use of above created UserSchema
const User = mongoose.model("User", userSchema);

// exporting the User model to be used by other parts of the application 
export default User;
