import json
import logging
import os
import urllib.request
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

# URL secreta del webhook de Slack (en .env y en Render). Si no existe, no se envía nada.
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")
ZONA_BOLIVIA = ZoneInfo("America/La_Paz")


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
            pass
    except Exception as error:
        logger.warning("No se pudo enviar el aviso a Slack: %s", error)


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
