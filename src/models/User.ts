import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export type UserData = {
  username: string;
  password: string;
  lastLogin?: Date | null;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IUserDocument extends UserData, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<void>;
}

export interface IUserModel extends mongoose.Model<IUserDocument> {
  findByUsernameWithPassword(username: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const safeRet = ret as Record<string, unknown>;
        delete safeRet.password;
        delete safeRet.refreshToken;
        delete safeRet.__v;
        return safeRet;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const safeRet = ret as Record<string, unknown>;
        delete safeRet.password;
        delete safeRet.refreshToken;
        delete safeRet.__v;
        return safeRet;
      },
    },
  },
);

userSchema.index({ username: 1, createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByUsernameWithPassword = function (
  username: string,
): Promise<IUserDocument | null> {
  return this.findOne({ username }).select('+password').exec();
};

userSchema.methods.updateLastLogin = async function (): Promise<void> {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

export const User = mongoose.model<IUserDocument, IUserModel>(
  'User',
  userSchema,
);
