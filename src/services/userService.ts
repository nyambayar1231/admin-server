import type { IUserDocument } from "../models/User.js";
import { User } from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRefreshTokenId,
  type TokenPayload,
} from "../utils/jwt.js";

type CreateUserInput = {
  username: string;
  password: string;
};

type LoginInput = {
  username: string;
  password: string;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
};

type LoginResult = {
  userId: string;
  username: string;
  tokens: TokenPair;
  message: string;
};

type RefreshResult = {
  tokens: TokenPair;
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

    const payload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
    };

    const tokens = await this.generateTokenPair(payload);

    user.refreshToken = tokens.refreshTokenId;
    await user.save({ validateBeforeSave: false });

    return {
      userId: user._id.toString(),
      username: user.username,
      tokens,
      message: "Login successful",
    };
  }

  async logout(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const payload = await verifyRefreshToken(refreshToken);

      const user = await User.findById(payload.userId).select("+refreshToken");

      if (!user || user.refreshToken !== payload.tokenId) {
        throw new Error("Invalid refresh token");
      }

      const newPayload: TokenPayload = {
        userId: user._id.toString(),
        username: user.username,
      };

      const tokens = await this.generateTokenPair(newPayload);

      user.refreshToken = tokens.refreshTokenId;
      await user.save({ validateBeforeSave: false });

      return {
        tokens,
        message: "Token refreshed successfully",
      };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  private async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const refreshTokenId = generateRefreshTokenId();

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload, refreshTokenId),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshTokenId,
    };
  }

  async findByUsername(username: string): Promise<IUserDocument | null> {
    return User.findOne({ username });
  }

  async findById(userId: string): Promise<IUserDocument | null> {
    return User.findById(userId);
  }
}
