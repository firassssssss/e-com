import { IUseCase } from '../../../usecases/IUseCase.js';
import { Inject, Service } from "typedi";
import { IUserRepository } from '../../../repositories/IUserRepository.js';
import { ILocalizationService } from '../../../services/ILocalizationService.js';
import { UserSigninPayload } from '../../NotificationEvents.js';

export type UserSigninOutput = {
    success: true;
    data: {
        sender: {
            id: string;
            name: string;
            image: string | null;
        }
    };
    title: string;
    body: string;
} | {
    success: false;
    error: string;
}

@Service()
export class UserSignin implements IUseCase<UserSigninPayload, UserSigninOutput> {

    constructor(
        @Inject('IUserRepository') private readonly userRepo: IUserRepository,
        @Inject('ILocalizationService') private readonly localizationService: ILocalizationService,
    ) { }

    async execute(request: UserSigninPayload): Promise<UserSigninOutput> {
        const sender = await this.userRepo.findById(request.userId);
        if (!sender) {
            return {
                success: false,
                error: 'USER_NOT_FOUND',
            };
        }
        const userLanguage = await this.localizationService.getUserLanguage(request.userId);
        const notificationTexts = this.localizationService.getNotificationTexts(userLanguage);
        const texts = notificationTexts.USER_SIGNIN;
        return {
            success: true,
            data: {
                sender: {
                    id: sender.id,
                    name: sender.name,
                    image: sender.image,
                },
            },
            title: texts.title,
            body: texts.body,
        };
    }

}
