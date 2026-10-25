import json
import logging
import os
import urllib.request
from zoneinfo import ZoneInfo

# Se usa el logger de uvicorn para que los mensajes aparezcan en los Logs de Render
logger = logging.getLogger("uvicorn.error")

# URL secreta del webhook de Slack (en .env y en Render). Si no existe, no se envía nada.
# Se quitan espacios y comillas por si se pegaron por error al configurarla.
SLACK_WEBHOOK_URL = (os.getenv("SLACK_WEBHOOK_URL") or "").strip().strip("\"'")
ZONA_BOLIVIA = ZoneInfo("America/La_Paz")

if not SLACK_WEBHOOK_URL:
    logger.info("Slack: SLACK_WEBHOOK_URL no está configurada; no se enviarán avisos")
elif not SLACK_WEBHOOK_URL.startswith("https://hooks.slack.com/services/"):
    logger.warning("Slack: SLACK_WEBHOOK_URL no parece una URL de webhook de Slack")
else:
    logger.info("Slack: webhook configurado; se enviarán avisos")


def enviar_slack(texto: str):
    if not SLACK_WEBHOOK_URL:
        return

    peticion = urllib.request.Request(
        SLACK_WEBHOOK_URL,
        data=json.dumps({"text": texto}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    # Si Slack falla, solo se registra el error: la cita o el producto ya se guardaron
    try:
        with urllib.request.urlopen(peticion, timeout=5):
            logger.info("Slack: aviso enviado")
    except urllib.error.HTTPError as error:
        # Slack explica el problema en el cuerpo (ej. "no_service" si el webhook fue borrado)
        detalle = error.read().decode("utf-8", "replace")
        logger.warning("Slack: no se pudo enviar el aviso (HTTP %s: %s)", error.code, detalle)
    except Exception as error:
        logger.warning("Slack: no se pudo enviar el aviso: %s", error)


def aviso_nueva_cita(cita) -> str:
    fecha = cita.appointment_date.astimezone(ZONA_BOLIVIA).strftime("%d/%m/%Y %H:%M")
    return (
        ":calendar: *Nueva cita registrada*\n"
        f"• Cliente: {cita.client_name}\n"
        f"• Diseño: {cita.design_name or 'Personalizado'}\n"
        f"• Tatuador: {cita.artist_name or 'Sin asignar'}\n"
        f"• Fecha: {fecha}\n"
        f"• Precio: Bs {cita.price:.2f}\n"
        f"• Detalle: {cita.tattoo_description}"
    )


def aviso_nuevo_producto(producto) -> str:
    return (
        ":package: *Nuevo producto en el inventario*\n"
        f"• {producto.name}\n"
        f"• Precio: Bs {producto.price:.2f} · Stock: {producto.stock}"
    )
