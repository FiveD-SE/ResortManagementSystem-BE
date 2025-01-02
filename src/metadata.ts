/* eslint-disable */
export default async () => {
	const t = {
		['./modules/user/entities/user.entity']: await import(
			'./modules/user/entities/user.entity'
		),
		['./modules/imgur/dto/response/uploadImageToImgur.response.dto']:
			await import(
				'./modules/imgur/dto/response/uploadImageToImgur.response.dto'
			),
		['./modules/auth/dto/response/login.response.dto']: await import(
			'./modules/auth/dto/response/login.response.dto'
		),
	};
	return {
		'@nestjs/swagger': {
			models: [
				[
					import('./modules/shared/base/base.entity'),
					{ BaseEntity: { id: { required: false, type: () => String } } },
				],
				[
					import(
						'./modules/imgur/dto/response/uploadImageToImgur.response.dto'
					),
					{
						UploadImageToImgurResponseDto: {
							imageUrl: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/user/entities/user.entity'),
					{
						User: {
							email: { required: true, type: () => String },
							password: { required: true, type: () => String },
							firstName: { required: true, type: () => String },
							lastName: { required: true, type: () => String },
							role: { required: true, type: () => String },
							avatar: { required: true, type: () => String },
							isVerified: { required: true, type: () => Boolean },
							isActive: { required: true, type: () => Boolean },
						},
					},
				],
				[
					import('./modules/user/dto/request/updateUser.request.dto'),
					{
						UpdateUserRequestDTO: {
							firstName: { required: true, type: () => String },
							lastName: { required: true, type: () => String },
							role: { required: true, type: () => String },
							isVerified: { required: true, type: () => Boolean },
							isActive: { required: true, type: () => Boolean },
						},
					},
				],
				[
					import('./modules/user/dto/request/changeProfile.request.dto'),
					{ ChangeProfileRequestDTO: {} },
				],
				[
					import('./modules/auth/dto/request/changePassword.request.dto'),
					{
						ChangePasswWordRequestDto: {
							oldPassword: { required: true, type: () => String },
							newPassword: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/auth/dto/request/register.request.dto'),
					{
						RegisterRequestDTO: {
							email: { required: true, type: () => String, format: 'email' },
							password: { required: true, type: () => String },
							firstName: { required: true, type: () => String },
							lastName: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/auth/dto/request/resetPassword.request.dto'),
					{
						ResetPasswordRequestDTO: {
							token: { required: true, type: () => String },
							newPassword: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/auth/dto/request/verifyAccount.request.dto'),
					{
						VerifyAccountRequestDTO: {
							token: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/auth/dto/response/login.response.dto'),
					{
						LoginResponseDTO: {
							accessToken: { required: true, type: () => String },
							refreshToken: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/auth/dto/request/forgotPassword.request.dto'),
					{
						ForgotPasswordRequestDTO: {
							email: { required: true, type: () => String, format: 'email' },
						},
					},
				],
				[
					import('./modules/auth/dto/request/login.request.dto'),
					{
						LoginRequestDTO: {
							email: { required: true, type: () => String, format: 'email' },
							password: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/auth/dto/request/refreshToken.request.dto'),
					{
						RefreshTokenRequestDTO: {
							refreshToken: { required: true, type: () => String },
							userId: { required: true, type: () => String },
						},
					},
				],
				[
					import('./modules/auth/dto/request/sendEmailVerify.request.dto'),
					{
						SendEmailVerfiyRequestDTO: {
							email: { required: true, type: () => String, format: 'email' },
						},
					},
				],
			],
			controllers: [
				[
					import('./app.controller'),
					{ AppController: { getHello: { type: String } } },
				],
				[
					import('./modules/user/user.controller'),
					{
						UserController: {
							findOne: { type: t['./modules/user/entities/user.entity'].User },
							update: { type: t['./modules/user/entities/user.entity'].User },
							changeAvatar: {
								type: t['./modules/user/entities/user.entity'].User,
							},
						},
					},
				],
				[
					import('./modules/imgur/imgur.controller'),
					{
						ImgurController: {
							uploadImageToImgur: {
								type: t[
									'./modules/imgur/dto/response/uploadImageToImgur.response.dto'
								].UploadImageToImgurResponseDto,
							},
						},
					},
				],
				[
					import('./modules/user/userManager.controller'),
					{
						UserManagerController: {
							findAllWithPagination: {},
							updateUser: {
								type: t['./modules/user/entities/user.entity'].User,
							},
						},
					},
				],
				[
					import('./modules/auth/auth.controller'),
					{
						AuthController: {
							register: {},
							login: {
								type: t['./modules/auth/dto/response/login.response.dto']
									.LoginResponseDTO,
							},
							getMe: { type: t['./modules/user/entities/user.entity'].User },
							refreshAccessToken: {},
							resetPassword: {},
							changePassword: {},
							verifyAccount: {},
							forgotPassword: {},
							sendEmailVerify: {},
						},
					},
				],
			],
		},
	};
};
