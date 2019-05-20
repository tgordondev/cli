/**
 * @author: JP Lew (jp@cto.ai)
 * @date: Thursday, 25th April 2019 11:44:48 am
 * @lastModifiedBy: JP Lew (jp@cto.ai)
 * @lastModifiedTime: Friday, 3rd May 2019 3:22:22 pm
 * @copyright (c) 2019 CTO.ai
 */
interface Token {
    registryProject: string;
    registryUser: string;
    registryPass: string;
}
export interface RegistryResponse {
    data: {
        registry_tokens: Token[];
    };
}
export {};
