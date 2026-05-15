package com.blockchain.backend.petchain.petchainAPI.security;

public record ApiActor(
        String actorId,
        String actorOrgId,
        String actorRole,
        ActorType actorType
) {
    public static ApiActor anonymous() {
        return new ApiActor(null, null, null, ActorType.UNKNOWN);
    }
}
