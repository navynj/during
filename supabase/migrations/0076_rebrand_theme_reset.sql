-- 0076: the rebrand's theme reset, run once (H78x; Yoonji, in the session, 2026-11-14)
--
-- The rebrand makes Black on the light ground the default. Everyone still on
-- the old default, exactly Blue + dark, moves to Black + Light; any other
-- choice is someone's own and stays. Approved in the session: "yes to all
-- three. Include the 4 Home theme settings rows and the 2 per-member diary
-- colours (only those exactly Blue + dark), and change the profile columns'
-- default to Black + Light in the same migration."
--
-- A one-time data reset, not a rule: a person who picks Blue + dark after
-- this keeps it. Production counts before (one read-only query, 2026-11-14):
-- profiles 11, my_theme_settings 4, member_pool_settings 2, pools 0.
--
-- Expand only: rows updated in place and two column defaults changed.
-- Nothing is dropped or narrowed; the app in production reads any colour.

update public.profiles
   set theme_color = 'black', theme_mode = 'light'
 where theme_color = 'blue' and theme_mode = 'dark';

update public.my_theme_settings
   set home_color = 'black', mode = 'light'
 where home_color = 'blue' and mode = 'dark';

update public.member_pool_settings
   set theme = 'black', theme_mode = 'light'
 where theme = 'blue' and theme_mode = 'dark';

alter table public.profiles
  alter column theme_color set default 'black',
  alter column theme_mode set default 'light';
