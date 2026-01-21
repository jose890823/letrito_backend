interface WelcomeTemplateData {
  firstName: string;
  lastName?: string;
  brandName?: string;
}

export function getWelcomeEmailTemplate(data: WelcomeTemplateData): string {
  const brandName = data.brandName || 'Letrito';
  const fullName = data.lastName
    ? `${data.firstName} ${data.lastName}`
    : data.firstName;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">
                ¡Bienvenido!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 18px; line-height: 1.5;">
                Hola <strong>${fullName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                ¡Gracias por unirte a <strong>${brandName}</strong>!
              </p>

              <p style="margin: 0 0 30px; color: #555555; font-size: 15px; line-height: 1.6;">
                Tu cuenta ha sido creada exitosamente. Ahora puedes ayudar a tus hijos a aprender a leer y escribir de forma divertida con Letrito, nuestro amigable zorro.
              </p>

              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px; font-weight: 600;">
                  ¿Qué sigue?
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8;">
                  <li>Crea un perfil para tu hijo</li>
                  <li>Comienza con las vocales</li>
                  <li>Observa cómo Letrito crece junto a tu hijo</li>
                </ul>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                <strong>${brandName}</strong>
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                Aprende a leer jugando
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
