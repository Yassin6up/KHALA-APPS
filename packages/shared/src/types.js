"use strict";
/** Cross-cutting types shared between backend, app and admin. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURES = exports.APPS = void 0;
exports.APPS = {
    QADER: 'qader',
    AFIA: 'afia',
};
/** Feature keys used by the entitlement layer ("can this user access X?"). */
exports.FEATURES = {
    AI_MENTOR: 'ai_mentor',
    CONSULT_1ON1: 'consult_1on1',
    LIBRARY_PREMIUM: 'library_premium',
    COMMUNITY: 'community',
    CHALLENGES: 'challenges',
};
