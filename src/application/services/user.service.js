import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/account.entity.js';
import { HttpError } from '../../infrastructure/utils/HttpError.js';

// WARNING: In a real application, use environment variables for secrets!
const ACCESS_TOKEN_SECRET = 'your_super_secret_access_token_key';
const REFRESH_TOKEN_SECRET = 'your_super_secret_refresh_token_key';

export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  signUp = async (signUpData) => {
    const { email, password, name } = signUpData;

    if (!email || !password || !name) {
      throw new HttpError('Email, password, and name are required.', 400);
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new HttpError('This email is already in use.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userEntity = new User({
      email,
      password: hashedPassword,
      name,
    });

    const createdUser = await this.userRepository.createUser(userEntity);

    // Do not return password in the response
    const { password: _, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  };

  signIn = async (signInData) => {
    const { email, password } = signInData;

    if (!email || !password) {
      throw new HttpError('Email and password are required.', 400);
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new HttpError('Invalid credentials.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpError('Invalid credentials.', 401);
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    // Here you might want to save the refresh token in the database
    // For simplicity, we'll just return it for now.

    return { accessToken, refreshToken };
  };
}
