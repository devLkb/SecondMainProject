package com.blockchain.backend.common;

public final class DomainValues {
    private DomainValues() {
    }

    public static final class MemberType {
        public static final String USER = "user";
        public static final String HOSPITAL = "hospital";
        public static final String INSURANCE = "insurance";
        public static final String PLATFORM = "platform";

        private MemberType() {
        }
    }

    public static final class AccountStatus {
        public static final String ACTIVE = "active";
        public static final String SUSPENDED = "suspended";
        public static final String WITHDRAWN = "withdrawn";

        private AccountStatus() {
        }
    }

    public static final class PointOwnerType {
        public static final String HOSPITAL = "hospital";
        public static final String INSURANCE = "insurance";

        private PointOwnerType() {
        }
    }
}
