-- This file contains the schema for the database.
--
-- PostgreSQL database dump
--

-- Logs table
CREATE TABLE public."Logs" (
    id integer NOT NULL,
    "userIp" character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    "userEmail" character varying(255) NOT NULL,
    "userDomain" character varying(255) NOT NULL,
    message jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."Logs" OWNER TO postgres;

CREATE SEQUENCE public."Logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."Logs_id_seq" OWNER TO postgres;

ALTER SEQUENCE public."Logs_id_seq" OWNED BY public."Logs".id;


-- Projects table

CREATE TABLE public."Projects" (
    id integer NOT NULL,
    "projectId" character varying(255) NOT NULL,
    "projectName" character varying(255) NOT NULL,
    "organizationId" character varying(255),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" integer
);

ALTER TABLE public."Projects" OWNER TO postgres;

CREATE SEQUENCE public."Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."Projects_id_seq" OWNER TO postgres;

ALTER SEQUENCE public."Projects_id_seq" OWNED BY public."Projects".id;


-- ServiceAccountKeys table

CREATE TABLE public."ServiceAccountKeys" (
    id integer NOT NULL,
    "privateKeyId" character varying(255),
    "privateKeyData" text,
    "validAfterTime" timestamp without time zone,
    "validBeforeTime" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "serviceAccountEmail" character varying(255) NOT NULL
);

ALTER TABLE public."ServiceAccountKeys" OWNER TO postgres;

CREATE SEQUENCE public."ServiceAccountKeys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."ServiceAccountKeys_id_seq" OWNER TO postgres;

ALTER SEQUENCE public."ServiceAccountKeys_id_seq" OWNED BY public."ServiceAccountKeys".id;

-- ServiceAccounts table

CREATE TABLE public."ServiceAccounts" (
    id integer NOT NULL,
    "projectId" character varying(255),
    "serviceAccountEmail" character varying(255) NOT NULL,
    "displayName" character varying(255),
    "clientId" character varying(255),
    "privateKey" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public."ServiceAccounts" OWNER TO postgres;

CREATE SEQUENCE public."ServiceAccounts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."ServiceAccounts_id_seq" OWNER TO postgres;

ALTER SEQUENCE public."ServiceAccounts_id_seq" OWNED BY public."ServiceAccounts".id;

-- Tokens table

CREATE TABLE public."Tokens" (
    id integer NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text,
    scope character varying(255),
    "tokenType" character varying(255),
    "expiryDate" bigint,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "userId" integer NOT NULL
);

ALTER TABLE public."Tokens" OWNER TO postgres;

CREATE SEQUENCE public."Tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."Tokens_id_seq" OWNER TO postgres;

ALTER SEQUENCE public."Tokens_id_seq" OWNED BY public."Tokens".id;

-- Users table

CREATE TABLE public."Users" (
    id integer NOT NULL,
    "googleId" character varying(255) NOT NULL,
    "jwtSecret" character varying(255),
    email character varying(255) NOT NULL,
    "projectName" character varying(255),
    tokens jsonb,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE public."Users" OWNER TO postgres;

CREATE SEQUENCE public."Users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."Users_id_seq" OWNER TO postgres;

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;

ALTER TABLE ONLY public."Logs" ALTER COLUMN id SET DEFAULT nextval('public."Logs_id_seq"'::regclass);

ALTER TABLE ONLY public."Projects" ALTER COLUMN id SET DEFAULT nextval('public."Projects_id_seq"'::regclass);

ALTER TABLE ONLY public."ServiceAccountKeys" ALTER COLUMN id SET DEFAULT nextval('public."ServiceAccountKeys_id_seq"'::regclass);

ALTER TABLE ONLY public."ServiceAccounts" ALTER COLUMN id SET DEFAULT nextval('public."ServiceAccounts_id_seq"'::regclass);

ALTER TABLE ONLY public."Tokens" ALTER COLUMN id SET DEFAULT nextval('public."Tokens_id_seq"'::regclass);

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);

ALTER TABLE ONLY public."Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Projects"
    ADD CONSTRAINT "Projects_projectId_key" UNIQUE ("projectId");

ALTER TABLE ONLY public."ServiceAccountKeys"
    ADD CONSTRAINT "ServiceAccountKeys_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."ServiceAccounts"
    ADD CONSTRAINT "ServiceAccounts_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY public."ServiceAccounts"
    ADD CONSTRAINT "ServiceAccounts_serviceAccountEmail_key" UNIQUE ("serviceAccountEmail");

ALTER TABLE ONLY public."Tokens"
    ADD CONSTRAINT "Tokens_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_jwtSecret_key" UNIQUE ("jwtSecret");

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."ServiceAccounts"
    ADD CONSTRAINT fk_project FOREIGN KEY ("projectId") REFERENCES public."Projects"("projectId") ON DELETE CASCADE;

ALTER TABLE ONLY public."Projects"
    ADD CONSTRAINT "fk_projects_userId" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."ServiceAccountKeys"
    ADD CONSTRAINT "fk_serviceAccount" FOREIGN KEY ("serviceAccountEmail") REFERENCES public."ServiceAccounts"("serviceAccountEmail") ON DELETE CASCADE;

ALTER TABLE ONLY public."ServiceAccountKeys"
    ADD CONSTRAINT "fk_serviceaccountkeys_serviceAccountEmail" FOREIGN KEY ("serviceAccountEmail") REFERENCES public."ServiceAccounts"("serviceAccountEmail") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."ServiceAccounts"
    ADD CONSTRAINT "fk_serviceaccounts_projectId" FOREIGN KEY ("projectId") REFERENCES public."Projects"("projectId") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."Tokens"
    ADD CONSTRAINT "fk_tokens_userId" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- PostgreSQL database dump complete
--

