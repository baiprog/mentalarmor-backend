import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, HttpStatus, Post, Req, Res, BadRequestException } from '@nestjs/common';
import { parse, isValid } from '@telegram-apps/init-data-node';
import * as jwt from 'jsonwebtoken';
import { getUserByTgId } from './user.service';

@Controller('/auth')
export class AuthController {
  // Эндпоинт аутентификации
  @Post('/signin')
  async signin(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const { initData } = req.body as { initData: string }; // Достаем данные из запроса

    // Валидируем initData с помощью токена бота (он фейковый)
    const isInitDataValid = isValid(
      initData,
      '7842222127:AAGXdwkA-jZ5n3znWPMT7bGKC7C0GomE2uc',
    );

    if (!isInitDataValid) {
      throw new BadRequestException('AUTH__INVALID_INITDATA'); // Ошибка, если initData некорректна
    }

    // Парсим initData и достаем Telegram ID пользователя
    const tgId = parse(initData).user?.id;

    if (!tgId) {
      throw new BadRequestException('AUTH__INVALID_INITDATA'); // Ошибка, если ID отсутствует
    }

    // Допустим, что тут мы достаем пользователя из базы
    const user = await getUserByTgId({ tg_id: tgId });

    if (!user) {
      throw new BadRequestException('AUTH__USER_NOT_FOUND'); // Ошибка, если пользователь не найден
    }

    const { id, tg_id, roles } = user; // Достаем нужные данные

    // Создаем access и refresh токены, зашивая в них данные пользователя
    const accessToken = jwt.sign(
      { id, tg_id, roles },
      'at_s3cr3t_x23Hjasdkl!@asd', // Секрет для access-токена
      { expiresIn: '5m' }, // Время жизни токена
    );

    const refreshToken = jwt.sign(
      { id, tg_id, roles },
      't_s3cr3t_1klajsdfj!32@#', // Секрет для refresh-токена
      { expiresIn: '7d' }, // Время жизни токена
    );

    // Опции для установки cookies
    const cookiesOptions = {
      httpOnly: true, // Доступно только через HTTP (JS не может прочитать)
      secure: true, // Передается только по HTTPS
      path: '/', // Доступно во всем домене
      sameSite: 'strict', // Защита от CSRF-атак
    };

    // Устанавливаем токены в cookies
    res.cookie('ACCESS_TOKEN', accessToken, cookiesOptions);
    res.cookie('REFRESH_TOKEN', refreshToken, cookiesOptions);

    res.status(HttpStatus.OK).send(true); // Отправляем успешный ответ
  }
}