declare class DatabaseService {
    private baseUrl;
    private apiKey;
    constructor();
    private getHeaders;
    findTargetUser(id: string): Promise<any>;
    upsertTargetUser(data: any): Promise<any>;
    upsertTweet(data: any): Promise<any>;
    upsertProfile(data: any): Promise<any>;
    createInteraction(data: any): Promise<any>;
    findProject(id: string): Promise<any>;
}
declare const db: DatabaseService;
export default db;
//# sourceMappingURL=DatabaseService.d.ts.map