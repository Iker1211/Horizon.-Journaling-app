import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rlkfornfrumvixwvcihy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const targetEmail = process.argv[2] || 'velezlucasiker1@gmail.com';
const newPassword = process.argv[3];

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: SUPABASE_SERVICE_ROLE_KEY no está definido.');
  console.log('\n📖 Instrucciones de uso:');
  console.log('  1. Ve a tu Dashboard de Supabase -> Project Settings -> API');
  console.log('  2. Copia la clave "service_role" (secret)');
  console.log('  3. Ejecuta este comando:');
  console.log(`     SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key" node scripts/admin-reset-password.mjs "${targetEmail}" "TuNuevaContraseña123!"\n`);
  process.exit(1);
}

if (!newPassword) {
  console.error('\n❌ Debes especificar la nueva contraseña.');
  console.log(`Uso: SUPABASE_SERVICE_ROLE_KEY="..." node scripts/admin-reset-password.mjs "${targetEmail}" "<nueva_contraseña>"\n`);
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetPassword() {
  console.log(`\n🔍 Buscando usuario con correo: ${targetEmail}...`);

  // List users to find ID
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error al listar usuarios:', listError.message);
    process.exit(1);
  }

  const user = usersData.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

  if (!user) {
    console.error(`❌ No se encontró ningún usuario registrado con el correo: ${targetEmail}`);
    console.log('Usuarios existentes en el proyecto:');
    usersData.users.forEach(u => console.log(` - ${u.email} (ID: ${u.id})`));
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ID ${user.id}`);
  console.log(`🔄 Actualizando contraseña a la nueva clave especificada...`);

  const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      password: newPassword,
      email_confirm: true,
    }
  );

  if (updateError) {
    console.error('❌ Error actualizando contraseña:', updateError.message);
    process.exit(1);
  }

  console.log(`\n🎉 ¡Contraseña restablecida exitosamente para ${targetEmail}!`);
  console.log(`👉 Ya puedes iniciar sesión en la app directamente con tu correo y nueva contraseña.\n`);
}

resetPassword();
