grant delete on table public.predictions to authenticated;

drop policy if exists "Users can remove their predictions"
  on public.predictions;

create policy "Users can remove their predictions"
  on public.predictions
  for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
