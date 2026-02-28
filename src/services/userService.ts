import type { IUserDocument } from "../models/User.js";
import { User } from "../models/User.js";

type CreateUserInput = {
  username: string;
  password: string;
};

type LoginInput = {
  username: string;
  password: string;
};

type LoginResult = {
  user: Omit<IUserDocument, "password" | "refreshToken">;
  message: string;
};

export class UserService {
  async createUser(input: CreateUserInput): Promise<IUserDocument> {
    const user = new User({
      username: input.username,
      password: input.password,
    });
    return user.save();
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await User.findByUsernameWithPassword(input.username);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await user.comparePassword(input.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    await user.updateLastLogin();

    // Convert to plain object and remove sensitive fields
    const userObject = user.toObject();

    return {
      user: userObject as Omit<IUserDocument, "password" | "refreshToken">,
      message: "Login successful",
    };
  }

  async findByUsername(username: string): Promise<IUserDocument | null> {
    return User.findOne({ username });
  }
}
