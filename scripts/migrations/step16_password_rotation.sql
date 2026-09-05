-- ====================================================
-- REP TRACK — STEP 16 Secure Password Rotation
-- Target Database: rep-track-dev (Cloudflare D1)
-- ====================================================

-- 1. Revoke all existing sessions to enforce re-authentication
DELETE FROM `sessions`;

-- 2. Update password hashes and force must_change_password = 1
UPDATE `users` SET `password_hash` = '$2b$10$IGmDWeAC/JGMi.DJA8KaL.k/TiK7.lEJ/4uYXvxpPKTZ0c4X4ucX6', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR1';
UPDATE `users` SET `password_hash` = '$2b$10$FaoLTl0gVwNICQmZrth2R.jT0TPnFvJ4u8OKAz72zz2IuK9OhG82G', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM1';
UPDATE `users` SET `password_hash` = '$2b$10$X1M4lWIoH8K7BJ9BWSWmhO0aUPMdryTiBlbM2vQoun4eWK8n4n7JS', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM2';
UPDATE `users` SET `password_hash` = '$2b$10$DFv7Zwah89tURcZ1Da8yMOL5Qbbgr021to438m/NBWna0hNsDr7Ze', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR2';
UPDATE `users` SET `password_hash` = '$2b$10$mYgnhRJPgvDPdwvCXPB9X.5G7In8GLLBRS9njQTiZ.RFUjE91a30y', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR3';
UPDATE `users` SET `password_hash` = '$2b$10$y9F1wZDxmthLDjr/pFllr.X69N2kjZJ37BY0TiYQQ9GF7tx23uQR.', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM3';
UPDATE `users` SET `password_hash` = '$2b$10$KwTs0E867CIm4e1yx7fO4Otq47.rjqAtZiPR/ulB5gaq1EhjOdluK', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR4';
UPDATE `users` SET `password_hash` = '$2b$10$x5yZY..kZ1bevnaGLnx86Ooj.c5VdqUqm7VnurWPHmTI5jdibxJRi', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR5';
UPDATE `users` SET `password_hash` = '$2b$10$yIYMUDVqHXrMS1IsfdhqKu9hlrAnGVvZCt3EoVW0s7M41ii2cktHW', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR6';
UPDATE `users` SET `password_hash` = '$2b$10$B5efUwG9H.gkwGMr5iuU2uGzwM3zKqupNV1kmXDVFdsxA8LhdG48.', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR7';
UPDATE `users` SET `password_hash` = '$2b$10$qo9vjlevNo4MnvRv90L3puzB1RGvAyjTFa69anTNfnqZX9o7hL5Yq', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR8';
UPDATE `users` SET `password_hash` = '$2b$10$rzDAOOfLRTlKBC5Q.9bszuMa1iq5QgMnGH20.9ytUxMR7xVCu0snm', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR9';
UPDATE `users` SET `password_hash` = '$2b$10$uoOGEnyKCGvtLBu7aTdbruxfqAk2KRz2giyD63dlfv9fv/5DPuQCu', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR10';
UPDATE `users` SET `password_hash` = '$2b$10$tE.3dIpuUkKn92iiEbKXK.st1caEF6UHHfDHLu38xGnBW7rYj5uUO', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR11';
UPDATE `users` SET `password_hash` = '$2b$10$ZNZZigVFrl1igqHbNK2Al.cDPUEqEfmmda8MiDFxJa9CKXRiyWlOC', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR12';
UPDATE `users` SET `password_hash` = '$2b$10$Ohtk/W9mmaQk3d3kfkOTyuXr0479HqSFoG1H2KAOMUUxxa87uuDrq', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR13';
UPDATE `users` SET `password_hash` = '$2b$10$/DdBRJ5szQIa1jnhfHJjKO7V/n.in2KpCAtrh5R68twTXLV1.1wIq', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR14';
UPDATE `users` SET `password_hash` = '$2b$10$AqNG433dYhXeYU2DWm4eZOYSufAHA4z/ujaxBYb/eDrcz9bvcA2cK', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR15';
UPDATE `users` SET `password_hash` = '$2b$10$YjNsYan07aGBJnZjL4AUhub.NBNCuSLeJthlFFHAHsL04S2IRT8/O', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR16';
UPDATE `users` SET `password_hash` = '$2b$10$./HMcIVPUJUfBvsWwx4R4uXpXq0FOhZxrWTUJzrzmFXRrOogicrzq', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR17';
UPDATE `users` SET `password_hash` = '$2b$10$wRTAbCZu7WIAxwc7c7kpVevF2NSdq0B.nSC4fj5AtMOqiVgc642uK', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR18';
UPDATE `users` SET `password_hash` = '$2b$10$LMW0XxaJEuNTkO3aApw2seJ02SVyUv63KkMTPlf8DNbKDeXK19jjW', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR19';
UPDATE `users` SET `password_hash` = '$2b$10$xsK7b16Hsy0tTVJTApSKxeoN6600RPebmtHaey8vUCj.rM9C4FpCS', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR20';
UPDATE `users` SET `password_hash` = '$2b$10$m/tzY6jtvfNc4ViSzeI2ne5E9m4uityebd9rDzzChd/5k2HBiCyD2', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR21';
UPDATE `users` SET `password_hash` = '$2b$10$/U5BX9/HhmOimFvaX1w0MeIfz3YasR94hENICNW.LarOksS.gIid6', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR22';
UPDATE `users` SET `password_hash` = '$2b$10$.QXvRVi/pc/zIuftSSrdQ.YvJUYwFqBenysqXO612/.RV.h237EZy', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR23';
UPDATE `users` SET `password_hash` = '$2b$10$dZrZ6GNdgOvJsisxYHJdueBd0FhsOGByT3hKMNvGldBGHR0U6m3va', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR24';
UPDATE `users` SET `password_hash` = '$2b$10$lE50s0SAiDOy.1afhLGuAu.CpK72WjmGYcVIQ9s941btp/mV1sG8i', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR25';
UPDATE `users` SET `password_hash` = '$2b$10$LLIXn16Mv.HFj1EPOQV3wOPOuCEfdln21Za72/aFThPGUQmv4Mngy', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR26';
UPDATE `users` SET `password_hash` = '$2b$10$Qb0V/LgZtD9oegVK3d9o1ON0N7xJ/03rVfa9rCnO0HQFvqAXth16W', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR27';
UPDATE `users` SET `password_hash` = '$2b$10$cl5AW3Rv1NKhyDGAyPAMNeYoGRfvpc/.Iw/mrvU2gxW.7xT8yydPG', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR28';
UPDATE `users` SET `password_hash` = '$2b$10$MC1jkzlMsphoHUS3AHSYteLviYyTR54mDOXmP.wJSDrELQtR6oVd6', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR29';
UPDATE `users` SET `password_hash` = '$2b$10$UGM6ekPlEUDxz5/WBTdVke7PasMKMvNim5UHTydFFWClVs1UjBLL.', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR30';
UPDATE `users` SET `password_hash` = '$2b$10$7PTJQXEcupFaKNeqEvOlieat0OPpK68VVQaSyMrANdjRBhl/3kzoG', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR31';
UPDATE `users` SET `password_hash` = '$2b$10$KatVvk1.4h9Z.2K/DaBGpe1.nzF2.o8BoZcNjktTBiy4skqc51RPu', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR32';
UPDATE `users` SET `password_hash` = '$2b$10$uq1WKlXZ5/Dqq1Li/oDvK.sUtQgJA8S4P4yzEjndRaxqsJFbtIakK', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR33';
UPDATE `users` SET `password_hash` = '$2b$10$/DUyqH.KTAhdamQbnoMkde.GTnXe3.a.n8MPpDt4Fc.JCK2B.HdXu', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'BUM1';
UPDATE `users` SET `password_hash` = '$2b$10$vGyEKbY4Ljs1CXQY9Vint.hZkoCdhQFeKvVtezjCbmRRTW.W0SpHW', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'BUM2';
UPDATE `users` SET `password_hash` = '$2b$10$8iMZ5hQzBiYfNGsSOAyAYOiJKgr7eiMFzldtelAteTHrPVWg4t6z.', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'BUM3';
UPDATE `users` SET `password_hash` = '$2b$10$PUism6mcI.7fT/VfsW.MOua8YqAW7Hxlh7NuvHUp.fFU2IcuDkiCS', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'AM1';
UPDATE `users` SET `password_hash` = '$2b$10$0bhimR0y7OG5IcuCP5TLMez2mDp1RiG6QSVzLUfFSswKg.hIox6CO', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'AM2';
UPDATE `users` SET `password_hash` = '$2b$10$/x/dmMv1SEkdj.f6.AZX/OGMZMvAlyaLuC.Ac6Q3u5VQCJyCK5igS', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM4';
UPDATE `users` SET `password_hash` = '$2b$10$X1xRGd/c83VBzmxbvkOwhOX.7841eA22ABI6hW5T.T0XkR2fBsyNu', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM5';
UPDATE `users` SET `password_hash` = '$2b$10$wIZyW89FRkTYYhSYxbpFM.soP8HBFNM4IcDm3ZuzegUG95f/Cont2', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'OM1';
UPDATE `users` SET `password_hash` = '$2b$10$AQ2e7VFYGUSxi6UvP36QieISpZA14CiNXnFZkNUZudIJ5PeVGiJIK', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'OM2';
UPDATE `users` SET `password_hash` = '$2b$10$nPn7TgYmX57VTegBy6gELOEoeU0k0vE.sg1HKCACdZk4wgCNHZCxW', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM6';
UPDATE `users` SET `password_hash` = '$2b$10$VJQvz6nQocmO9fwoRkgDN.oTe2hXpNhfrZPzpSVbxgI0KAGliaMuC', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'OM3';
UPDATE `users` SET `password_hash` = '$2b$10$mNQLrS1V4w.wsupJZ2z5ZuDbLi6Wwn8LJs5wicr8.PskHHm7ZnzQ6', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM7';
UPDATE `users` SET `password_hash` = '$2b$10$T4ur1DC4A3/BP051lDaM8OH6C3g0N4h1pTczAm2cs04Cyu5JfExKK', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM8';
UPDATE `users` SET `password_hash` = '$2b$10$MVoXlhRtjJ5u.aY7BSDy4Ovs3aTSEvpIpq2rVqJXupi2WPzGYRhRq', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM9';
UPDATE `users` SET `password_hash` = '$2b$10$/DbqOqj5Zw8ZuR8pJaNe7.hapFAhJJFvKIPqWGQz2y7QNLc14K/ji', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM10';
UPDATE `users` SET `password_hash` = '$2b$10$HGaoPhCIHtjR2NXgwF/LXOsEwooM/eZGFUbflbVdMEdlvrlQirpdW', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM11';
UPDATE `users` SET `password_hash` = '$2b$10$IbvZV/if.d.kLrqXwzZ68OiJYCiPM7lpJb8qcD6scrgc7.kClKRlS', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM12';
UPDATE `users` SET `password_hash` = '$2b$10$R3G9MkbWrLFcry7JjKyAU.3fEFeCLNrTymBlu1BbPymxmFqL8SBgC', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM13';
UPDATE `users` SET `password_hash` = '$2b$10$DvI.CiC2Xj/lqGkfPkj5L.B5fpuCy4.0onzxz8Upm7LK9HAkvnMY6', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'DM14';
UPDATE `users` SET `password_hash` = '$2b$10$pCdga72o99xDMiCBpWSAOO/t3SfM3jHrSD3LcOHb/xGrAVcojXm4e', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR34';
UPDATE `users` SET `password_hash` = '$2b$10$STy/esngCCjhG/mioPLP6OoUmmrrMPdOLz1T7mR9mQdHgVv6tBFum', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR35';
UPDATE `users` SET `password_hash` = '$2b$10$9QDbRHLplWkVLnUAY/CDc.I5ZFLRrq3xp.uq8xCi7YciiSDLs2VB2', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MR36';
UPDATE `users` SET `password_hash` = '$2b$10$3koESM4g9gb5fY.iB3TNhuZbobIV/DTfD74zCccTaxDvQuhy0kGv2', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'PM1';
UPDATE `users` SET `password_hash` = '$2b$10$8PvMMK5ySjRp0cEk2TP7TeFM7BUxoYdblQUg.aqKMx9tMuN7di7Fi', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'PM2';
UPDATE `users` SET `password_hash` = '$2b$10$RKATc8eJSKaSyhxoxpHO9uYlwMcDs29C1BraRx0qRFOPp2GpE3ijC', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'PM3';
UPDATE `users` SET `password_hash` = '$2b$10$2LZd2V0WqAAnpC1iAYFel.jQs7ec.zcU4hols9rS4AuWcL2pquc7C', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'MM1';
UPDATE `users` SET `password_hash` = '$2b$10$BK2itkKtoDiFsjNXhCwQFOhA9FWZWTcZCeaKteGQxYuZbp7oav1We', `must_change_password` = 1, `updated_at` = datetime('now') WHERE `username` = 'SMD1';
