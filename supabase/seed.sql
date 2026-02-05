SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict rgj1gOYKVaxhhIwv7Qp6jmb4SMBrbqZzzbS9IoRNf0w2a2w95jsO6HUtRpcWekt

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '0b8aaf85-0d11-494a-a621-219c7d54604e', 'authenticated', 'authenticated', 'dono1@gmail.com', '$2a$10$2yVaJnqM5q40O04OQBCi2OcmeUbOiH3rBIua6UPZ5wg1AgEgKx.Ey', '2026-02-03 14:02:40.084815+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-03 16:35:56.663671+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 14:02:40.04862+00', '2026-02-03 16:35:56.697553+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '5a578001-8640-4194-b110-fa3571b425f5', 'authenticated', 'authenticated', 'cliente2@gmail.com', '$2a$10$bRz6kKkYbLMK6TjHA6aZd.l.L6eg3F9S1ywxGnIP5qu3iks/14rU6', '2026-02-03 14:02:43.213309+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 14:02:43.20995+00', '2026-02-03 14:02:43.214098+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'cda2fce4-5cd2-4c42-a754-49cd837f02cc', 'authenticated', 'authenticated', 'julioccr1609@gmail.com', '$2a$10$xh5hv6MKCr8re3qEH3bK5OGSpCgYbyzjA.WcOLQ.S5uU9gfArJqSK', '2026-02-03 13:56:58.979272+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-03 14:19:42.852606+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 13:56:58.95239+00', '2026-02-03 19:43:31.418636+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2cc4558b-bcc1-4d19-8adb-018c83351b05', 'authenticated', 'authenticated', 'dono2@gmail.com', '$2a$10$DDhO483QmUtAxck3kLlI/OnXlDCRHEmi4vIE0lkkp/ugAAlhowxNO', '2026-02-03 14:02:40.926325+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 14:02:40.920826+00', '2026-02-03 14:02:40.932253+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4ef470e8-16f7-4c34-bcfa-27a6755dc2da', 'authenticated', 'authenticated', 'barber1@gmail.com', '$2a$10$pg/D/Q1C7hVyDw02yOXIv.F0PWuFsE1uXH64eCEN6YZiZChxt7j.6', '2026-02-03 14:02:41.882349+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 14:02:41.874209+00', '2026-02-03 14:02:41.8843+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd3408eb4-e921-4194-80c8-48116ea35016', 'authenticated', 'authenticated', 'barber2@gmail.com', '$2a$10$aITg/xS2Pfh0Ww8t3sJXre0Qau3XHt8wjtBMISZuW.0M8yIpb4/gW', '2026-02-03 14:02:42.330889+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 14:02:42.324493+00', '2026-02-03 14:02:42.331673+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '26322143-be9b-4dcb-bbeb-996b1eaaa945', 'authenticated', 'authenticated', 'cliente1@gmail.com', '$2a$10$4nwvMffNLmi37akkYZ6UuuwwzWmwnRh41n8ZpvBDS8tNM5TBh8NtW', '2026-02-03 14:02:42.777737+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 14:02:42.771478+00', '2026-02-03 14:02:42.778897+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('cda2fce4-5cd2-4c42-a754-49cd837f02cc', 'cda2fce4-5cd2-4c42-a754-49cd837f02cc', '{"sub": "cda2fce4-5cd2-4c42-a754-49cd837f02cc", "email": "julioccr1609@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 13:56:58.971254+00', '2026-02-03 13:56:58.971782+00', '2026-02-03 13:56:58.971782+00', 'fad4c3d4-4319-44d7-abc6-579d8ac1e42a'),
	('0b8aaf85-0d11-494a-a621-219c7d54604e', '0b8aaf85-0d11-494a-a621-219c7d54604e', '{"sub": "0b8aaf85-0d11-494a-a621-219c7d54604e", "email": "dono1@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 14:02:40.071048+00', '2026-02-03 14:02:40.071724+00', '2026-02-03 14:02:40.071724+00', 'bfeacfce-96ff-4e3c-a3ec-a65971f205a9'),
	('2cc4558b-bcc1-4d19-8adb-018c83351b05', '2cc4558b-bcc1-4d19-8adb-018c83351b05', '{"sub": "2cc4558b-bcc1-4d19-8adb-018c83351b05", "email": "dono2@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 14:02:40.924639+00', '2026-02-03 14:02:40.924699+00', '2026-02-03 14:02:40.924699+00', '8796201b-2b22-4d7b-9692-42c631b752b9'),
	('4ef470e8-16f7-4c34-bcfa-27a6755dc2da', '4ef470e8-16f7-4c34-bcfa-27a6755dc2da', '{"sub": "4ef470e8-16f7-4c34-bcfa-27a6755dc2da", "email": "barber1@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 14:02:41.877126+00', '2026-02-03 14:02:41.877178+00', '2026-02-03 14:02:41.877178+00', '9643b460-7599-4dfa-9c6f-0e4b037033fa'),
	('d3408eb4-e921-4194-80c8-48116ea35016', 'd3408eb4-e921-4194-80c8-48116ea35016', '{"sub": "d3408eb4-e921-4194-80c8-48116ea35016", "email": "barber2@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 14:02:42.328253+00', '2026-02-03 14:02:42.32831+00', '2026-02-03 14:02:42.32831+00', '36f00ff7-0fa7-4dbe-a062-5fd26bb18607'),
	('26322143-be9b-4dcb-bbeb-996b1eaaa945', '26322143-be9b-4dcb-bbeb-996b1eaaa945', '{"sub": "26322143-be9b-4dcb-bbeb-996b1eaaa945", "email": "cliente1@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 14:02:42.775776+00', '2026-02-03 14:02:42.775842+00', '2026-02-03 14:02:42.775842+00', 'dc6d2cc5-e2b5-454e-93f2-74ce5fc19562'),
	('5a578001-8640-4194-b110-fa3571b425f5', '5a578001-8640-4194-b110-fa3571b425f5', '{"sub": "5a578001-8640-4194-b110-fa3571b425f5", "email": "cliente2@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 14:02:43.21167+00', '2026-02-03 14:02:43.211722+00', '2026-02-03 14:02:43.211722+00', 'db850604-15ee-4b41-8f6b-2e4eaee1bf4b');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('cea2794e-f5a0-4246-89ce-5b4bb3f4dd7d', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 14:06:54.890476+00', '2026-02-03 14:06:54.890476+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('8d041b0a-afb4-4174-a3ab-83db6fb4a2b0', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 14:08:01.072257+00', '2026-02-03 14:08:01.072257+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('6727543e-ec35-4143-8fd3-c05c845ab019', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 14:13:12.539877+00', '2026-02-03 14:13:12.539877+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('60bcd54b-5877-4129-ac53-c056835f5506', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 14:13:41.263467+00', '2026-02-03 14:13:41.263467+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('6345a574-d815-4751-baa8-c8c4a22e8e67', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 14:19:10.280315+00', '2026-02-03 14:19:10.280315+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('44df4de8-075e-4220-836d-db8e440ba960', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 14:17:33.161658+00', '2026-02-03 15:15:46.507394+00', NULL, 'aal1', NULL, '2026-02-03 15:15:46.507279', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('d289e936-93ff-4a4a-83c8-28848d43dd6d', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 15:37:24.507556+00', '2026-02-03 15:37:24.507556+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('dd5da6ea-30e0-4ec5-88c5-fa9a465cdc96', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 15:46:18.000628+00', '2026-02-03 15:46:18.000628+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('1fbb9a1b-6039-4e3e-951a-b7d957f17373', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 15:52:02.771966+00', '2026-02-03 15:52:02.771966+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('f0736ec0-b4eb-49bd-833f-8756409101d5', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 16:05:39.686616+00', '2026-02-03 16:05:39.686616+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('ffdadc2a-2771-4fe9-ae10-c907dda500d0', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 16:14:49.306329+00', '2026-02-03 16:14:49.306329+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('41c064dc-f25a-488b-bb42-c7450e0e2b8d', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 16:23:44.311388+00', '2026-02-03 16:23:44.311388+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('d6024f67-c8b4-4ace-9e45-6494dc8b19ab', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 16:35:56.663783+00', '2026-02-03 16:35:56.663783+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL),
	('8696bcb1-aa63-474a-ac5e-c79887725937', 'cda2fce4-5cd2-4c42-a754-49cd837f02cc', '2026-02-03 14:19:42.852714+00', '2026-02-03 19:43:31.438864+00', NULL, 'aal1', NULL, '2026-02-03 19:43:31.438739', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36', '170.238.55.212', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('cea2794e-f5a0-4246-89ce-5b4bb3f4dd7d', '2026-02-03 14:06:54.912979+00', '2026-02-03 14:06:54.912979+00', 'password', '4d9273c7-4af8-47dc-9e37-0d3ef6346be5'),
	('8d041b0a-afb4-4174-a3ab-83db6fb4a2b0', '2026-02-03 14:08:01.076164+00', '2026-02-03 14:08:01.076164+00', 'password', 'de87534b-b116-4040-8410-89738e9edfc8'),
	('6727543e-ec35-4143-8fd3-c05c845ab019', '2026-02-03 14:13:12.590781+00', '2026-02-03 14:13:12.590781+00', 'password', '727cbe03-472a-4472-953b-d0c782f56943'),
	('60bcd54b-5877-4129-ac53-c056835f5506', '2026-02-03 14:13:41.322274+00', '2026-02-03 14:13:41.322274+00', 'password', '1bc98595-fffb-4e54-8fe7-d22e291285a8'),
	('44df4de8-075e-4220-836d-db8e440ba960', '2026-02-03 14:17:33.190443+00', '2026-02-03 14:17:33.190443+00', 'password', 'af9ec66d-f051-4759-b20e-d8ddcbfd5d5d'),
	('6345a574-d815-4751-baa8-c8c4a22e8e67', '2026-02-03 14:19:10.288814+00', '2026-02-03 14:19:10.288814+00', 'password', '9c1ec48c-9b6e-4a6e-bb0e-b89f3e2bca84'),
	('8696bcb1-aa63-474a-ac5e-c79887725937', '2026-02-03 14:19:42.855948+00', '2026-02-03 14:19:42.855948+00', 'password', '6f9ec2ab-c199-4d97-b1ba-498e79775950'),
	('d289e936-93ff-4a4a-83c8-28848d43dd6d', '2026-02-03 15:37:24.563093+00', '2026-02-03 15:37:24.563093+00', 'password', 'df579022-d6b7-4e07-9fcc-f181975080a8'),
	('dd5da6ea-30e0-4ec5-88c5-fa9a465cdc96', '2026-02-03 15:46:18.02555+00', '2026-02-03 15:46:18.02555+00', 'password', '0502b591-4eee-40d7-be38-faf70f26186d'),
	('1fbb9a1b-6039-4e3e-951a-b7d957f17373', '2026-02-03 15:52:02.776029+00', '2026-02-03 15:52:02.776029+00', 'password', '0064c4d6-d1e4-47e1-8779-96fc574075c3'),
	('f0736ec0-b4eb-49bd-833f-8756409101d5', '2026-02-03 16:05:39.734475+00', '2026-02-03 16:05:39.734475+00', 'password', '23e5af44-7658-452e-a4bc-e2d0c34e003d'),
	('ffdadc2a-2771-4fe9-ae10-c907dda500d0', '2026-02-03 16:14:49.328911+00', '2026-02-03 16:14:49.328911+00', 'password', 'ccff8d08-75c0-4eaa-b06e-febd5c8a8bda'),
	('41c064dc-f25a-488b-bb42-c7450e0e2b8d', '2026-02-03 16:23:44.361154+00', '2026-02-03 16:23:44.361154+00', 'password', 'd02e9a9a-8771-4fb7-8d7a-ecff3213a40c'),
	('d6024f67-c8b4-4ace-9e45-6494dc8b19ab', '2026-02-03 16:35:56.700193+00', '2026-02-03 16:35:56.700193+00', 'password', '51362131-9d10-4c1a-9848-3db640f9e8b0');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 2, 'gjtebmurolvl', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 14:06:54.903782+00', '2026-02-03 14:06:54.903782+00', NULL, 'cea2794e-f5a0-4246-89ce-5b4bb3f4dd7d'),
	('00000000-0000-0000-0000-000000000000', 3, 'hyp2cbdk23j7', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 14:08:01.073954+00', '2026-02-03 14:08:01.073954+00', NULL, '8d041b0a-afb4-4174-a3ab-83db6fb4a2b0'),
	('00000000-0000-0000-0000-000000000000', 4, '5iy6hj6obt7g', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 14:13:12.576048+00', '2026-02-03 14:13:12.576048+00', NULL, '6727543e-ec35-4143-8fd3-c05c845ab019'),
	('00000000-0000-0000-0000-000000000000', 5, 'gn5ftovbebqv', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 14:13:41.290815+00', '2026-02-03 14:13:41.290815+00', NULL, '60bcd54b-5877-4129-ac53-c056835f5506'),
	('00000000-0000-0000-0000-000000000000', 7, 'cajuz35acaqy', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 14:19:10.283874+00', '2026-02-03 14:19:10.283874+00', NULL, '6345a574-d815-4751-baa8-c8c4a22e8e67'),
	('00000000-0000-0000-0000-000000000000', 6, 'qi7rxyezgiak', '0b8aaf85-0d11-494a-a621-219c7d54604e', true, '2026-02-03 14:17:33.176271+00', '2026-02-03 15:15:46.457193+00', NULL, '44df4de8-075e-4220-836d-db8e440ba960'),
	('00000000-0000-0000-0000-000000000000', 9, 'juojfd4cnstv', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 15:15:46.475611+00', '2026-02-03 15:15:46.475611+00', 'qi7rxyezgiak', '44df4de8-075e-4220-836d-db8e440ba960'),
	('00000000-0000-0000-0000-000000000000', 10, 'xxrttdkjd3om', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 15:37:24.5479+00', '2026-02-03 15:37:24.5479+00', NULL, 'd289e936-93ff-4a4a-83c8-28848d43dd6d'),
	('00000000-0000-0000-0000-000000000000', 11, 'pwfukw6aop2j', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 15:46:18.017441+00', '2026-02-03 15:46:18.017441+00', NULL, 'dd5da6ea-30e0-4ec5-88c5-fa9a465cdc96'),
	('00000000-0000-0000-0000-000000000000', 12, 'zyxrha5j3kho', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 15:52:02.774055+00', '2026-02-03 15:52:02.774055+00', NULL, '1fbb9a1b-6039-4e3e-951a-b7d957f17373'),
	('00000000-0000-0000-0000-000000000000', 13, '3jpetclh3zth', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 16:05:39.707004+00', '2026-02-03 16:05:39.707004+00', NULL, 'f0736ec0-b4eb-49bd-833f-8756409101d5'),
	('00000000-0000-0000-0000-000000000000', 14, 'f4yelft54otw', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 16:14:49.320336+00', '2026-02-03 16:14:49.320336+00', NULL, 'ffdadc2a-2771-4fe9-ae10-c907dda500d0'),
	('00000000-0000-0000-0000-000000000000', 15, 'dgepsjtdsivo', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 16:23:44.339728+00', '2026-02-03 16:23:44.339728+00', NULL, '41c064dc-f25a-488b-bb42-c7450e0e2b8d'),
	('00000000-0000-0000-0000-000000000000', 16, 'na2kxca6aulv', '0b8aaf85-0d11-494a-a621-219c7d54604e', false, '2026-02-03 16:35:56.688283+00', '2026-02-03 16:35:56.688283+00', NULL, 'd6024f67-c8b4-4ace-9e45-6494dc8b19ab'),
	('00000000-0000-0000-0000-000000000000', 8, '3hvoawyjidmd', 'cda2fce4-5cd2-4c42-a754-49cd837f02cc', true, '2026-02-03 14:19:42.854707+00', '2026-02-03 19:43:31.383651+00', NULL, '8696bcb1-aa63-474a-ac5e-c79887725937'),
	('00000000-0000-0000-0000-000000000000', 17, 'f5ulosr5vgim', 'cda2fce4-5cd2-4c42-a754-49cd837f02cc', false, '2026-02-03 19:43:31.401641+00', '2026-02-03 19:43:31.401641+00', '3hvoawyjidmd', '8696bcb1-aa63-474a-ac5e-c79887725937');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "name", "slug", "owner_id", "created_at", "updated_at", "subscription_status", "plan_type", "logo_url", "banner_url", "primary_color", "secondary_color", "theme_mode") VALUES
	('7ea72506-a86d-4588-9a0f-fc47ee1645ea', 'BarberPro Demo', 'barberpro-demo', 'cda2fce4-5cd2-4c42-a754-49cd837f02cc', '2026-02-03 13:56:59.603628+00', '2026-02-03 13:56:59.603628+00', 'active', 'premium', NULL, NULL, NULL, NULL, 'dark'),
	('1edb6c78-0fed-4a97-8033-11a1ec990328', 'Barbearia Dono1', 'barbearia-1', '0b8aaf85-0d11-494a-a621-219c7d54604e', '2026-02-03 14:02:43.762998+00', '2026-02-03 14:02:43.762998+00', 'active', 'premium', NULL, NULL, '#3a55a6', '#8212a1', 'dark'),
	('9c88d80d-e3c4-4374-abc2-093bfb119d85', 'Barbearia Dono 2', 'barbearia-2', '2cc4558b-bcc1-4d19-8adb-018c83351b05', '2026-02-03 14:02:43.948886+00', '2026-02-03 14:02:43.948886+00', 'active', 'basic', NULL, NULL, '#d43535', '#ffffff', 'dark');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "name", "email", "role", "avatar_url", "job_title", "created_at", "organization_id") VALUES
	('26322143-be9b-4dcb-bbeb-996b1eaaa945', 'cleitinho', 'cliente1@gmail.com', 'CUSTOMER', NULL, NULL, '2026-02-03 14:02:42.953442+00', NULL),
	('5a578001-8640-4194-b110-fa3571b425f5', 'Cliente 2', 'cliente2@gmail.com', 'CUSTOMER', NULL, NULL, '2026-02-03 14:02:43.390808+00', NULL),
	('4ef470e8-16f7-4c34-bcfa-27a6755dc2da', 'cleitão', 'barber1@gmail.com', 'BARBER', NULL, NULL, '2026-02-03 14:02:42.063786+00', '1edb6c78-0fed-4a97-8033-11a1ec990328'),
	('d3408eb4-e921-4194-80c8-48116ea35016', 'barber2', 'barber2@gmail.com', 'BARBER', NULL, NULL, '2026-02-03 14:02:42.515555+00', '9c88d80d-e3c4-4374-abc2-093bfb119d85'),
	('cda2fce4-5cd2-4c42-a754-49cd837f02cc', 'Julio Admin', 'julioccr1609@gmail.com', 'SUPER_ADMIN', NULL, NULL, '2026-02-03 13:56:59.886804+00', '7ea72506-a86d-4588-9a0f-fc47ee1645ea'),
	('2cc4558b-bcc1-4d19-8adb-018c83351b05', 'Dono 2', 'dono2@gmail.com', 'ADMIN', NULL, NULL, '2026-02-03 14:02:41.370721+00', '9c88d80d-e3c4-4374-abc2-093bfb119d85'),
	('0b8aaf85-0d11-494a-a621-219c7d54604e', 'Dono 1', 'dono1@gmail.com', 'ADMIN', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUSEhIWFRUVGBUXFxUXFRcVFRcXFhgWFxcYFRUYHiggGBolGxUXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGi0lHyUtLS8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKy0tKy0tLS0tLS0tLS0tLS0tLf/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAAAAQIDBAUGBwj/xABPEAACAQIDBAYGBAkICAcAAAABAgADEQQSIQUxQVEGImFxgZETMqGxwdEHQlJyFCMzU2KCkqLwFRckssLS4fEWJUNUc3STwzQ1Y5Sjs9P/xAAZAQADAQEBAAAAAAAAAAAAAAAAAQIDBAX/xAArEQACAgEDAwMCBwEAAAAAAAAAAQIRAxIhMQQyQRMiUUJhFDNxgZHB8CP/2gAMAwEAAhEDEQA/ANI40VFWy6C5FxbrHf1d3Z5xt7xiLYWjqZvrw4TpSpUaUKeA5+7jHvqQOZ92vvtG0tbnwHcP8bxxOpPJff8A5RgKxuQOR+H+IkirqTzt7P8AOR011HOxJ7yRJxEAyl9bv+Ak1KuUcFd+p8rD4yOmtr9pvEYdYdze9YAbfR//AGhvqSNOPHX+OUvVKgWov6YK+K9Yf2vOc/hMQabBh4jmI7beNKigwNyoR++9j7h7ZnJb2KrZ1SzndiplxtccLMfNlI986GmwIBG4gEdxmPgUtja/3E9oX5TMI+TWoHrP973KswuljFXpMOTg91109s3MIbrf7RZvAk29lpi9MRpSPa/9mKTaVoIL3I2dlYr0lJWvc7j4SntuuaLU6w1AJRxzVtfMEad8zuiWKszUjuIzDvG/3zV6RU74d+zKfJh8I7tWgcalTLVaouVaoOgsb8Mjbz3bj4SWogIIPGYPRjFhg1B9QQSvcfWX4+cs7Bxhu1B/WpkhSd7Kpt5j3WgnasJRabRarVC9J+Dre4/SXXTv0I743AbQDgBtG9h7vlFrn0dYMfVqDK3LMNx8j7JgtRyMQS1gSNLaWNri4lpJknVFZXfAodbZTzU5fMDQ+Mx9mYuo1R09KSqgW0U+20s1ix3ux8cv9W0gWpEzYSlTvdzc2OpBY25KBfjyjsrMwC9UdRbmxYi5Oi7h4+Uztmj1jzc+wATZww/GL3k+Sj4mCJbNfdYX4HXug2MTLffuGm/2xWt7JnnUnQAcoijUp1gFBvcWv2+UpYrrto2/nuHZGLTNwB4R2IfMd1raRAH4On24RmUwgB5u5sPZ4mSbhpwGnhMjCYkVKwBRgVBa5a/Zoo0G/v0mzOmMlJWjQWmtgBGtvI7VHxkixtL1m7x/VEoCT6w7j7xJJFbrA9h+HyksQhRGVGsyjnm9146mbgGVcc9npntPtsPjE3W40rLhEz9oNog5D3Cw+M0DMvFtdu4AfH4yMzqDLxq5I7Ho3iM+HXmt0Phu9hEjxNT0T4mryp07d9nA9tpn9Da2tSnzAYeGh94h0pxFroN7MCfuoot7SfKZRftslx99Gp0Yq5sOn6N18jp7CIm21zVaA5Z2PgF+MpdDKvVqJyKt5gj+zNDHi9Vf0UP7zD+7JbuFjqslHOMTh6wYfVNx2qeHlcTrtrkNhqhG4pcH2iYW3MNdQ43roe4/4++RDbiNsnFVKbhzh1qISODKAQP3gPCLDvsVmXDM2hXZailN6EMT7l8fdNTbL2rLXpm2dVcHt9Ug+WvfPOOj22Fr3DFlqbyDUY5hzG4X7LTrfTM2HCq5DUnuD610qbw2beAwHb1p0PpZKOzM/Xi5cHZYmqK+G9Iu8dYjkV9YeV/OZ2XOSwPWstwdx0t3g9X2zJ6M7by1hRqL+VuGserYKT6QX1tuUjeMw3ixmhh2K1GU/VJTvtqD5giKOqnfJMq+kZg62Wq2RTnA64AJBHMEbu+0ujGKxtqDyI+O6U9jt/S633flNKu2h7jIcr5RndkWyh1V7Wc+0/KbWBrU0fNUdVAuLswAuTu1+7MnYg6qfdv53Mt1Oj1PGIRUZgM9+rbgLcR2mIDafaeFN/x9L9tfnIaO0MMpv6ekf11mEPo5wv5yr5r8oifR7hrX9LUt3r8oD3N+rtLDE6V6f7a/OMTH4fjXp3++vzmD/oBhvzlTzX5QXoBhj/tKnmvygG5v/h+G/P0/21+cJg/zf4X85V81+UIBucD0bysWcUyoAtcliWO+3W4DTzmzmuT3/wAWlHA1nIZntpYACwAHIW7TLlMWHv7+M3xr2I1RII4CNESkd/efn8ZYEojhGiOBiAShutyJHt+UobZB6tjb1uF+UuqbN3i/iND7LSrtQer4/CZ5exlY+5F3DPmUHmNe/j7ZjpVBO8X5TR2Q29fEfGeW9Ltq1mxFWjmypTdlAXTMB9o7z3buyJr1YIer05Oz1To3jaa4pEzrmbMuXMM2oJ3XvwEg2jihUrVCGBszC3EAE2BG8ePOeT9Fq/osVQa5C+lp5rG3VLAG9uwzq12umIxFZWAD+lqlDuuudrZTvBtyjXTXHTqM/wAR7tVHf9EqlqxX7SHzBB+c3K+tRuzKPZf+1OL6JYh1xVJScysSAT6y9VtCfrDt3999Omw+I9LWuoNkapmbhfRVA56f1ZjkhLHHTI1jJTnqRjfSNt4YbBV1U2qOEpprr+NvdhyIVX8QJ5d0Y216LZ+0MMTpWWiVHaKgV/3SPKdR9M9PXNfc1BCOFwtdvH8oJ5pRYgEX37+22s06dLTZlmb1FnDVmRg6mzA3BnouxNqitTzDQ7nXkd/lxnmoMvbK2g1CoHXUbmHMfOdkJ1yc7R6PiMQUAqqQDTObUXFtzgjiCpM6bBVHei1RxZlqNwK5kFgrWY3F8gPiZxb4tXosym6sjH2GeibM9Ug/YS/fYgyeoVUx4+GUdkN/S6vat/Ys0cc1lbuMzNkIFxlULuCDw3fKaOM1uOZA8zOIZd2Yll7lA8hN7YC/iFJ46+Zv8ZiVurS03uQo8dJ0WyCDRW27rDyJHwgNEhW2++sqUlJBS+6536d0tV6wAa40H8e+U8JXVSbA2I4mBRC2JsRx7OyIlXW1ozFUzcfxftHZHItoAS54RtokAPKNiovoxl9W5bXnw8re6agkNCmFUKNwmftXb1Kh1fWc7lGvmZ09sdzQ2FPs3yDA4xKmYobgW1sQDpvFxqNN40kBcnDu2rFkc+rY6qerl5jd4Sl0cq3ZteqQMotytqDyIMlzppfJSjabN+AbfGUt1uWnlA6MDz08RqPjKokS9lvxS/7vzHvkeP1CEbjf22MmG8jmL/A+y0z6b9XIfqtp7QR8ZGXta+S8a3s4PaPSapR2kHBPo6LBCg3FSB6TTidf3RKfTZV/DarobrUyVFI3EOi6zP6UJbGVwft38CAR75VasWCgm+UZR3XJA9phj2gqMcjuTskpPYgjeCCPCPNQ5s4Nje9xwN76SBTHqZqmZnddFukF2Umwqpr2NbiPlOq6J7cS4zF82Q5gKbkFlNjqBl331uJ456UqQymxGoI4T2L6Pdk06lCnWq0UJZS1ygPWdi/HsMy6qScVZr06dujI6b4arjUrGmpPWSoiAXsFUL16nqm+RwFW+pFzpPKaTz6kCLmDW1ClezKSDYjw98886afRcK7tXwTLTdrl6L3CMx3lGHqk8iLdonPiyKOz4NMmNvfyeSq0UtNjE9Btp0zZsHVP3AKg80JlvZH0dbSxDAGgaK8XrWQAfd9ZvATp9SK8mGiXwRdDXerWGHsWpuRn0JCDjc8Mwuo5kie27ONzbccpBHapAtKGC6L4fZ2BqJTuzDLWq1SOs5pMH3fVUBTZeF+JJMsLiVWqrAhlYkXU3FyOznYSPW12ipQ0bfIuAp2xNY81X3n/AAk4uzqObe6Z2Kxio9V76WUDneWdnbUpekVjmItoACTc8LCZmZtbVrrT37qSGo3fY5RNPoVVLYKix3sGJ8XYziPpAq1KNBme/wDSHsAp1sBfW+4WFvGYuyfpNrYeilFMPTKoLAlmudSdbSXKi0j1/FgKpNr79+7WVPRhvUG4DTmeMpbI6UU61JGq5KedFbrEKuoBK9Y79ecs4Sorkmi6ta4JVg2/ugpJ8Daa5IcU5uO6w4G0FvfjHYynlYa5jblEpXuTGIk8IsZfvhADxfam1anVKlfRuLg0mDN2hgePZNXo7XwtX8q1d7D1UADXsOy4G/dOZbZeIWlTrvTAovfIwtYnzPI+U3MJsauPROtNhRf0fXz3zMUVmUKQSbm+62+P3SluO7NiwChV6obqrmO7MbDMfHUzEwamliyAOobcfVDAldOV2YafZE67CbGxN2z4KqwYFRapTUZTY+rmBubc+E5jalIpUV7EWvSa+9WRjkBtpvLDvtzms3fHg0xu5UatOpao687MPIAydxcW/i/CY+OxQFVCN5UMORsdRfuO6ayOCARuMtSttDcaSYBrgHiOHaNCPfMHbFSqtZcilqbZWJVQWsb3sS1hqBvHjNvPlYfpe/8AxHumZUaxy8iQO462/jnJy9oQVs4Hp3gGSstaxC1ABcsWOZR9Y7hccBpoZzyNPXMdg0r0zSqC6t5g8CDwInnO1+jGIoMcqmonBlFzb9JRqD7JliypqmGbC07RmAx2eN/Ba35qp+w3ymnsnoxisQ6qKZQE+s4y+SnU/wAazZziuWYKEnskN6O7IfG4hMPT+sbu32KY9dj3Dd2kT6LoUUpItOmLKgCqOQGkxOiXRujgKWSmLu9jUqH1mI3C/BRwE2c05MuTW/sdePHoQ4GSo8iEgFRjWyj1FQ5tBq7EZbHsCtf74mZRpCrA1ZBHCMBm0VzUaoO403HmpnPUq1OrSp1QqMHVWByjkPG95s9IsUKODxFU/UpVD45SAPMieV7D6dehoJRbD5wmgIfLp29XfLg6MM6ujvauHRvWRdey+vdNnY1AEqOF+U80H0hLf/wx/wCoP7st0fpQy7sMRwv6Qezqy7RhpZofS1tQ1MQKCnq0VFxwztqT5EDznCMIJtE1mYsDc3Ykm5JJG/zhVMzfJodR06oW2ZgW55P/AKzK/Q3aVTB7Nr4mgVFRawUBlzAZhTU3HcZf+kNh/JmBA3A07d3oifjMXYv/AJNiv+Yp/wDamS7f3Nn3fsdX0S6aYnECs2IyEUgrDKmXQ5y26/2ROs2N0wwOLc06FbM4AYgo6aEgaFlAOpHnPMegQ/FY3/hD3VZB9ESXxx/4X9unaXraciNKpHtHoj2+USbXouwQm9GR84V9sYhgMPUqXprdgoy2DEDl3y5iulOLw7U1pOVFOmmTRTbPTS5GbcSAJh0wij0gYsLEbra/4x2GvimckhCiJYDUELZPPdJTaHSNv+cbaf59h+qnyl/oziWrU3FbrZyxudc2b1r+OvjOaOyD+c9k2Nj4zD0cO9RWd6iAHJbQHMA+vdeOE2pbjVF3a9NUCI2YqNzX1XiCWGotqL+e+WNk18nVLFlOoJtpfhcDURdpOKtJKlNtCQysO6UqdPNc0wMwF2pjQHmUvoD2bteG86Ti1PVH+Pk2jNP2yNvHr1CeRB9sz6j5jfiQL9+6LhseCBTfMCwIBZWXdwJI3ythqua4Isymx7jqCOwj3HlJzStJryXiW9FpTHBpHFnIdA8vNzozVTrC34znzXs5TAjsPWKMHXeD/AhQM7ctHKZXw1cVFDruPs5iTKYzNjloLnz261rXuRcdo3Hxk6gb+e+RKZIIyR8ekgo1lcXVgw1Fwbi436iWKQjEcn9LOMKYEUV9avUVd4HUT8Y3tVR+tPIVwzW3e0TsvpV2kauNFJdVw6BT9+pZ2/d9HOUUnkZSMJu2RjCsOA81+cT8FbkP2l+cmv3wzHlCyR2BplWN+R4g8RylqrK+HvmP3Tx7pNXgB0nT9ydm4Kw0Hojzt+KYXPlM7YT/AOpsX/zFL/tTucC1sLh72/JUx+6JxlAf6sxtv95p7u+lOeM/p+/9m7jw/sWegC/iMa3/AKaj92pM76L65XEVmXRlwtVlPJlKETV+jdQ1LFoTbMEHmHBMi6K7EGFxlaktTODhKtiRY65N9jKlJXJEpNpMk/nA2l+eb9lflCZX8kH84fb84TotmVIy6mJpvSYLpYXy7vZNP6O0p+krvV9X0Lrr9phpbutOXpYfMwUWFza53azrDgjQQILZeYIuSRc3gA4NIsTTNLZtR1c/j6rK6cAEe4seF+MUPpKmNY/gLjlWOnKJEo1OjZP4GnK7eFmMm2fWC1lGtzdezX+BLnQ2mhwVMML3z/12mbtfaeFo10pKXeqXQWBFkJIHXPwGs1UnaFe5tbWGancfVZSPBgD7CR4zNr9UioOAs33ef6p17i0rYXbPpvwmnuNOugHapqAe9TNCLqn7kdmHeLJQY6U0DU9FGZOABAZRyF9CPEW7ZLSxKk2vY/ZIKt5HWcxvZPAiEIhmjsLHejfIx6rew8DOonCkTpthY/OuRj1l9o5wIkjVLgAkmwGpJ0AA3kmUMUzPTaqyZlAvTonqh+TVBbjwUjQbxfQWq9AOMrbrg24GxuAeYvw7JYDSkQM2ctQU19KQX3tYBQCdcqjgBu47t5lupXWmj1H9VFZz3KCT7pEhnMfSptP0OzygNmxDCl+qbtU/dW360CXsrPKKmMNV3rO65qjM7a7ixJt3C9vCOFQfbXzmZSEkJmlHLZf9MPtjzh6X9IeZ+UoAwzdsKA0cM120sdDu3yxiXA3/AOJPdM7BVspPE2Nh26eUrYrGEmw1Y7yOPYOQlRhfPAnKjssZ07y0aVKnRANNEUs5vqosTkTh+t4Tnae26noalAEZKrh26oJzDLaxvoOqJkByPWUjvBHvivT+sv8AnLjixx4QPJJ+TqeiXSYYT0gZM61Mt7HKy5b7gbhvW5ibuy9orWxdapTa4/A6o1BBBvT3g++eeUmzCT0Kz0yTTdkJBW6mxytvHceXZJydPGW62Y4ZXHZ8Fm78/bCZWWp+cbzPzhD05C1I3L+iQhgGP1bnq3PEcuc6XodX9C5qVWz3Uix4gdawN9DpMV9js5Gdha/An2aWkGMdqV0vf7J7N0go7/GdK8O9N1GGYMysAbrYEg2J1nG4qsgwuJVlLE1FCH7LWU3PgD5yalVX0QBTrdXrcb3F7jdHbOoq4rBlDD0g0IuNFhYqMTZuHrlAUrMqm9gGYAa8h2zAp1itX0p6xV8xN9SQ1738J6JVWnRpOwRQEVmsBbcCZ5xSGk0gSzZ6JO5xNr6MCz9ttR+8RO8nn/RraCUKxZx1WGXN9nW97ctJ3yMGAZSCDqCNQe4zLNeo7emrQR1mysr8PVbuPqnwa3gxlh0DCzAEciLyN0BBB3EWPjGYOqSLE3ZTlbvHHxBB8ZmbDxhyPUcjsbrr7TceBEUVXHrJftQ381NiPC8kBjgYBQ2liEY2Da/ZOjfsnWWKVQowZTYiQvTVhZgCORAI9sYMNb1HZey+YeTXt4WgJnbbPxq1VuNCN68QflLQE4LD4mvSYMuVrfZ6pPZla4PmJvYbpUNBUoVAf0QD8bDzgTR0tFZ5D9MG1vSYxcOD1cOgvr9epZm8lCeZm7tD6WqCgrhqDs+oDVcqUwefVJLd2nfPP62Pq1XapUbMzksxIGpPw+Am2PG3uzmy5FVIoX0klKmzeqpPu8zpLYdeNND4CONdt17DkNJssS8s59Qyns5vrMq+35R/4HSG+oT3W+UZC00UIrwK2P8ARURwY336290Wk9OncoljzJJ98ZaFpXHAiQYoVBlezKeW8dotM2tRak+Q6g7jzHOFQeje43H+CJpNTFank+suqH4Sef1Az0WxPbb4x8jQ+72ySIBLQixYAUvS1vtv+2fnNTC1g4UEHMBvJuTKYAk+CAz6TmNi1VruKyJ9UG7dul9e6LtB39BmRiM1ZjobGwBG+NxNEEs7X1bKOANgb6+EjxGPQYdE4qx08OEAMqtVq2szvY6WLEg+F41RFq185GlgITWKpGbGsst7N2rWw56jXXijaqe7ke0SvC0ppPkE2naO12Z0mo1dH/FNyY9U9z7vO0036rhvqv1T3/UPvHiJ5oySahjKtMWSowXTq3uumvqnQa8pi8K8HTHqX9SPTQI4Ti8J0xqj8pTV+1SUPlqD7Jr4bpbhm9bPTP6S3Hmt5k8ckbrNjl5N8RwMq4XaFGp6lVG7Awv5b5btINeRRK22sT6LD1anEIbfeOi+0iWgJz/T6tlwoW467qCLi9hdtBx1AjStoib0xbOBwyaiayiUsLSspJ3kGXV3Cd8TzBwEdEEWUIUCKBCLGAWhFiQEVsel1vy/yjsDVIAI3iSVFuCOYMzsPVym/A75PDGaGPpdYVBuceTDf5/AyAGWkbMppnjqvYw3S90S6I4raDH0Y9HSU2es4OUHiEXe7dg0HEiEmluNJvZGPmiz1j+aDD/75X/ZpfKLM/Vh8mnpT+Dx6W9lrd+QtqeyP27ss0Mhp1UrK4bmjqVto6ZmAvfQgm+st9EaFJ3IxCuwNgKdPNmqMSoCZhdgLFjprpYb5lQWQVKhqkteyqDlXhofabcZkY1gX05A+J3zq+lG0cFSLUqeFtVQFAczIUOvrj1W8Vuec45Lk3PGWo0ydVocVigxYESyRYRBFBgAQhCACFYmSOhACI0hJqOIqp6lV1+67AeQMSEA4LtHpBi0NxWY24MAwPYbi8tdKsX6avTPD0VMgcBnGc+8eUx7SSkxZgTwAHgoyj2CTpVpovW9LTZbAj04SKtUyqT5d8kTcJr5MyQRYgixgLFvEheMB14l4g1Nhqfd3nhEqkBTrc9mgHzgA68x6rWuO0zSqVJ3HQv6MGdhiMeMqXzLh/rNy9Kfqr+jv523TPJJJWyoxcnSMz6PuhVXG5a1bNTwyn1tz1bfVp8l5v4DXUe04eklJFp01CIgsqqLACPuAAAAABYACwAG4AcBKm0cclFC79wUeszcFUc/dqToJyym5cnXCCiWvSwnJf6RYn8xR/6rf3ISS6Z4u2Gf7DfsmFLar0MpoOVqg5s63uh3aHnb+OSY3bdZwUVyqnQ5SRmHLulBEtOhRRxamIFJJLEkk3JOpJO8k8TJBCLLJCEIQACIhHjFhABBC8UiFoAEWNA8IsAFhGxYAEfht/nGSalStqdP44wQC1KRY66AectCQrV7QfESSx527vmZQiQQDcte7X3RgQd/frJLygFseXnYe8xSh4kAcdbnwFt8bKmLxP1V38Ty7u2HAG3sHZdTG1hhqGUGxZixIVVBALMRck67t59sk6XdHauAqilUYOHXMjqCAw3MLHcQeGu8S19FdU061Y7nKoV52BYN/WE0/pW2k1RaAe11NQiwtpZb38bTz31j/F+g1/qs09P2ahPoh2MK1dsVUF1oBQgO41WF7/qrr3sDwnqWO2mtMhSHJOgC03b94Cw8TOe6EYM4PAUKWW9asDVK7tXsSWPBVUoCe4DUgTpEJsMxBPEgWBPYLmw8ZeSVyOnHHTEz6W1qjmyYWoR9piKY/f1PgDKg2LiKzekxFVFNiAtMFwgPBHew5XJW5t3AbwjhIKMb/RpPz1b/AOL/APOE2bwjoLPl5Vjoz0nZFDidRwjosBCMAhCEACEIQEEIQgMIQhAAhCITACZVA1MjqOW0HlHJRJ3yyigbowI6GHtqd/ulmNEUSqoQ6LGxbxiFMRUA3C0cFJ7O06ezfJFVB6xLeFh5fOAwwVZ0cVKbFSt+sNR2g8D3SZHqYzFUxVYtc7rCwResQAOBtbxkOIrXFgLCX+iC3xI7Ec/1R8ZnkjFe+t65Lx25KPg9awWJ9JjK3KlSRR+szX9tP3TXvOR6I4i1aqCfXYi55qFsPYZ0O08ZkNOmp69Vsq8cosSzEdgHmROI72P2m9lFq3ojfQ5Q5bsCb27l1lbDYCs+r4qoByWmKTeOYtYeAMvYbCqmouWO92N3Pe3LsFgOAlgGMkqfyYv52t/1n+cSXbwjEfMVohUR0J1nCMykbvKOVrxYhWACwiCLAAhCEACEIQAIRbX74l4AESEDAC2DHiRUTcSSWIeIsaI4QGJqez2mOUW+fGEWAhYRBFjARps9DB/SGPKm3tZJjNNzoSPxtU8kUeZP92Rl7GaYfzEdTgNxI0u9Q+TkfCWMLXP4ZQLMTZampN/rUhx7zK2z/wAmh5jN+11vjAN+N4dVAd2vWbnwHU/i04T0XwehGNqgkEDjpvI0O8gjcbXiU6mYBuBAPnrM/ZO0mrPU6oCIcobW5O+3gLE/eEZmL/IFHnV/9xW/vwmneEBHzNCEJ2HAEIQgARIsDAAhEBiwAIQhABVMKgsb842SjUWgBFAwEIATYY6GTiVcOdZaBlIBwjowR0YCxYkWAhYsbFjEI03+hyEiuRvIUDvs/wA5z7TpuhQ6lU/pgeSj5zLN2M36df8ARHSUlsAOQA8oWFybamwv3Xt7zC8fh1zOo5sB7ZxHoM7CorCiVQAsEsoJsL2sLngImzcKKNNaYN7DU7szHVm8SSZOTEvGZEmaEivCMR83QhCdhwBCEIAEIQgAjfKLCEACJCEACSUeMIQQEfE95hCEAHUfWEtCEJS4EOEcIQjAURYkIALFEIQENadN0L/J1P8Aif2ViwmWfsOjp/zEdDLOzfy1P7wiQnGd74OxMSEIzISEIRgf/9k=', NULL, '2026-02-03 14:02:40.52856+00', '1edb6c78-0fed-4a97-8033-11a1ec990328');


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."services" ("id", "name", "price", "duration_minutes", "description", "image_url", "created_at", "active", "organization_id") VALUES
	('0e05beb4-87a4-43d6-b160-c032833c852a', 'Degradê', 99.99, 30, 'Corte degradê clássico', 'https://images.unsplash.com/photo-1599351431202-6e0000a40aa0?q=80&w=800&auto=format&fit=crop', '2026-02-03 14:05:01.418891+00', true, '1edb6c78-0fed-4a97-8033-11a1ec990328'),
	('3f331251-f394-41a8-991c-d9ac96453d0e', 'Corte Premium', 350.00, 30, 'Corte premium exclusivo', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800&auto=format&fit=crop', '2026-02-03 14:05:01.684648+00', true, '9c88d80d-e3c4-4374-abc2-093bfb119d85'),
	('22e174b8-03cd-47af-93b8-ff23f3b5bfc8', 'Barba', 30.00, 20, 'Barba completa', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop', '2026-02-03 14:05:01.85483+00', true, '1edb6c78-0fed-4a97-8033-11a1ec990328'),
	('c13d1a1d-d280-4ec6-bfdd-5aea45582447', 'Combo Corte + Barba', 120.00, 50, 'Corte + barba completa', 'https://images.unsplash.com/photo-1503951914875-452162b7f304?q=80&w=800&auto=format&fit=crop', '2026-02-03 14:05:02.024883+00', true, '1edb6c78-0fed-4a97-8033-11a1ec990328');


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."settings" ("id", "interval_minutes", "schedule", "organization_id", "establishment_name", "address", "phone", "city", "state", "zip_code", "loyalty_enabled", "loyalty_target", "primary_color", "secondary_color") VALUES
	(1, 30, '"[{\"dayId\":0,\"isOpen\":false,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":1,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":2,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":3,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":4,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":5,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"19:00\"},{\"dayId\":6,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"14:00\"}]"', '1edb6c78-0fed-4a97-8033-11a1ec990328', 'Barbearia Dono1', 'Rua Bahia 151 Santa Lúcia', '64999032384', 'Jataí', 'GO', '75800029', true, 10, '#3b82f6', '#1A1A1A'),
	(2, 45, '"[{\"dayId\":0,\"isOpen\":false,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":1,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":2,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":3,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":4,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"18:00\"},{\"dayId\":5,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"19:00\"},{\"dayId\":6,\"isOpen\":true,\"openTime\":\"09:00\",\"closeTime\":\"14:00\"}]"', '9c88d80d-e3c4-4374-abc2-093bfb119d85', 'Barbearia Dono 2', 'Av. Principal 500', '64999000000', 'Jataí', 'GO', '75800000', true, 10, '#a00d0d', '#271b1b');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('profiles', 'profiles', NULL, '2026-02-03 15:39:33.700218+00', '2026-02-03 15:39:33.700218+00', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}', NULL, 'STANDARD'),
	('services', 'services', NULL, '2026-02-03 15:39:33.922724+00', '2026-02-03 15:39:33.922724+00', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}', NULL, 'STANDARD'),
	('organizations', 'organizations', NULL, '2026-02-03 15:39:34.110841+00', '2026-02-03 15:39:34.110841+00', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}', NULL, 'STANDARD'),
	('logos', 'logos', NULL, '2026-02-03 15:39:34.32985+00', '2026-02-03 15:39:34.32985+00', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}', NULL, 'STANDARD'),
	('banners', 'banners', NULL, '2026-02-03 15:39:34.7483+00', '2026-02-03 15:39:34.7483+00', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 17, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict rgj1gOYKVaxhhIwv7Qp6jmb4SMBrbqZzzbS9IoRNf0w2a2w95jsO6HUtRpcWekt

RESET ALL;
