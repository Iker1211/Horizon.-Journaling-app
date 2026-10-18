# Rollback del sistema de perfil

El despliegue debe hacerse en este orden: migraciones, función `delete-account` y, finalmente, clientes web/Android. Antes de aplicar las migraciones, crea una copia de seguridad administrada de Supabase.

Si el cliente nuevo falla, revierte primero el cliente. Las tablas y el bucket son compatibles hacia atrás y pueden permanecer sin afectar wrappers ni entradas.

Si hay que retirar también el backend, exporta `public.profiles` y el bucket privado `avatars`, elimina las cuatro políticas de `storage.objects`, después el bucket `avatars`, el trigger `on_horizon_user_created`, las tres políticas de `public.profiles`, el trigger `profiles_set_updated_at`, la tabla `public.profiles` y las funciones `handle_new_horizon_user` y `set_updated_at`. Retira al final la Edge Function. Este rollback elimina fotos y preferencias sincronizadas, por lo que solo debe ejecutarse después de verificar la copia de seguridad.

No se revierte `auth.users`, `big_themes`, `blog_entries` ni `milestones_2027`.
