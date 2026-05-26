import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    phone: null,
    passwordHash: 'hashed-password',
    role: 'OWNER',
    businessId: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    business: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      businessName: 'New Business',
    };

    it('should register a new user with business', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });
      mockPrisma.business.create.mockResolvedValue({
        id: 'biz-1',
        name: registerDto.businessName,
      });
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
        businessId: 'biz-1',
      });

      const result = await service.register(registerDto);

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrisma.business.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: registerDto.businessName,
          }),
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'correct-password',
    };

    it('should login with valid credentials', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        business: { id: 'biz-1', name: 'Test Biz' },
      });

      const result = await service.login(loginDto);

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        business: { id: 'biz-1', name: 'Test Biz', type: 'RETAIL', currency: 'USD' },
      });

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.business).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
