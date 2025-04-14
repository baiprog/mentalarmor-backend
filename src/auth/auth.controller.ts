import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { parse, isValid } from '@telegram-apps/init-data-node';
import * as jwt from 'jsonwebtoken';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  @Post('signin')
  async signIn(
    @Body() body: { initData: string },
    @Res() res: Response,
  ) {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!isValid(body.initData, BOT_TOKEN)) {
      throw new BadRequestException('Invalid initData');
    }

    const userInfo = parse(body.initData).user;
    if (!userInfo?.id) {
      throw new BadRequestException('Missing Telegram ID');
    }

    const user = { id: 1, tg_id: userInfo.id, roles: ['user'] };

    const accessToken = jwt.sign(user, process.env.JWT_AT_SECRET, { expiresIn: '5m' });
    const refreshToken = jwt.sign(user, process.env.JWT_RT_SECRET, { expiresIn: '7d' });

    res.cookie('ACCESS_TOKEN', accessToken, {
      httpOnly: true, secure: true, sameSite: 'strict',
    });
    res.cookie('REFRESH_TOKEN', refreshToken, {
      httpOnly: true, secure: true, sameSite: 'strict',
    });

    return res.status(HttpStatus.OK).send(true);
  }
}
