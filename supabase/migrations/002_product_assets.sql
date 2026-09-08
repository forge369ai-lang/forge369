insert into storage.buckets (id, name, public)
values ('product-assets', 'product-assets', false)
on conflict (id) do nothing;

create policy "Users upload their product assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read their product assets"
on storage.objects for select
to authenticated
using (bucket_id = 'product-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update their product assets"
on storage.objects for update
to authenticated
using (bucket_id = 'product-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their product assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-assets' and (storage.foldername(name))[1] = auth.uid()::text);
