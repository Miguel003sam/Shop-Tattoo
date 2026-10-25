import os
import secrets

from fastapi import FastAPI, BackgroundTasks, Depends, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from notificaciones import enviar_slack, aviso_nueva_cita, aviso_nuevo_producto
from models import Style, Artist, Client, Product, Design, Appointment
from schemas import (
    ProductCreate,
    ProductResponse,
    StyleCreate,
    StyleResponse,
    ArtistCreate,
    ArtistResponse,
    ClientCreate,
    ClientResponse,
    DesignCreate,
    DesignResponse,
    AppointmentCreate,
    AppointmentResponse,
)

app = FastAPI(
    title="Sistema de Salón de Tatuajes",
    description=(
        "API para gestionar estilos, tatuadores, clientes, productos, diseños y citas. "
        "Las rutas de administración piden la contraseña en la cabecera X-Admin-Key."
    ),
    version="3.0.0",
)
# Dominios permitidos: en Render se agrega el dominio de Vercel en ALLOWED_ORIGINS
ALLOWED_ORIGINS = [
    origen.strip()
    for origen in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origen.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ESTADOS_VALIDOS = {"pendiente", "confirmada", "completada"}

# Contraseña del modo administrador (en .env y en Render, nunca en el código)
ADMIN_KEY = os.getenv("ADMIN_KEY", "").strip()


def requiere_admin(x_admin_key: str | None = Header(default=None)):
    if not ADMIN_KEY:
        raise HTTPException(
            status_code=503,
            detail="El modo administrador no está configurado (falta ADMIN_KEY)",
        )
    # compare_digest evita adivinar la contraseña midiendo tiempos de respuesta
    if not x_admin_key or not secrets.compare_digest(x_admin_key, ADMIN_KEY):
        raise HTTPException(
            status_code=401,
            detail="Contraseña de administrador incorrecta",
        )


SOLO_ADMIN = [Depends(requiere_admin)]


def verificar_existe(db: Session, modelo, id_registro: int | None, nombre: str):
    if id_registro is not None and db.get(modelo, id_registro) is None:
        raise HTTPException(
            status_code=404,
            detail=f"{nombre} no encontrado",
        )


def obtener_o_404(db: Session, modelo, id_registro: int, nombre: str):
    registro = db.get(modelo, id_registro)
    if registro is None:
        raise HTTPException(
            status_code=404,
            detail=f"{nombre} no encontrado",
        )
    return registro


def actualizar(db: Session, registro, datos):
    for campo, valor in datos.model_dump().items():
        setattr(registro, campo, valor)
    db.commit()
    db.refresh(registro)
    return registro


def bloquear_si_tiene(db: Session, modelo, columna, id_registro: int, mensaje: str):
    # Impide borrar un registro que otros datos todavía usan
    cantidad = db.query(modelo).filter(columna == id_registro).count()
    if cantidad:
        raise HTTPException(
            status_code=409,
            detail=mensaje.format(cantidad=cantidad),
        )


def eliminar(db: Session, registro):
    db.delete(registro)
    db.commit()
    return Response(status_code=204)


@app.get("/")
def inicio():
    return {"mensaje": "Sistema de Salón de Tatuajes funcionando"}


@app.get("/admin/verificar", dependencies=SOLO_ADMIN)
def verificar_admin():
    return {"ok": True}


# ESTILOS

@app.get("/styles", response_model=list[StyleResponse])
def listar_estilos(db: Session = Depends(get_db)):
    return db.query(Style).order_by(Style.name.asc()).all()


@app.post("/styles", response_model=StyleResponse, status_code=201, dependencies=SOLO_ADMIN)
def crear_estilo(estilo: StyleCreate, db: Session = Depends(get_db)):
    if db.query(Style).filter(Style.name == estilo.name).first():
        raise HTTPException(
            status_code=400,
            detail="Ya existe un estilo con ese nombre",
        )

    nuevo = Style(**estilo.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@app.put("/styles/{style_id}", response_model=StyleResponse, dependencies=SOLO_ADMIN)
def editar_estilo(style_id: int, estilo: StyleCreate, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Style, style_id, "Estilo")

    repetido = db.query(Style).filter(Style.name == estilo.name, Style.id != style_id).first()
    if repetido:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un estilo con ese nombre",
        )

    return actualizar(db, registro, estilo)


@app.delete("/styles/{style_id}", status_code=204, dependencies=SOLO_ADMIN)
def eliminar_estilo(style_id: int, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Style, style_id, "Estilo")
    bloquear_si_tiene(
        db, Design, Design.style_id, style_id,
        "No se puede eliminar: el estilo tiene {cantidad} diseño(s). Cámbiales el estilo primero.",
    )
    return eliminar(db, registro)


# TATUADORES

@app.get("/artists", response_model=list[ArtistResponse])
def listar_tatuadores(db: Session = Depends(get_db)):
    return db.query(Artist).order_by(Artist.full_name.asc()).all()


@app.post("/artists", response_model=ArtistResponse, status_code=201, dependencies=SOLO_ADMIN)
def crear_tatuador(tatuador: ArtistCreate, db: Session = Depends(get_db)):
    nuevo = Artist(**tatuador.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@app.put("/artists/{artist_id}", response_model=ArtistResponse, dependencies=SOLO_ADMIN)
def editar_tatuador(artist_id: int, tatuador: ArtistCreate, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Artist, artist_id, "Tatuador")
    return actualizar(db, registro, tatuador)


@app.delete("/artists/{artist_id}", status_code=204, dependencies=SOLO_ADMIN)
def eliminar_tatuador(artist_id: int, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Artist, artist_id, "Tatuador")
    bloquear_si_tiene(
        db, Appointment, Appointment.artist_id, artist_id,
        "No se puede eliminar: el tatuador tiene {cantidad} cita(s) asignada(s).",
    )
    return eliminar(db, registro)


# CLIENTES (sus datos personales solo los ve el administrador)

@app.get("/clients", response_model=list[ClientResponse], dependencies=SOLO_ADMIN)
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.full_name.asc()).all()


# Público: un visitante se registra como cliente al reservar su cita
@app.post("/clients", response_model=ClientResponse, status_code=201)
def crear_cliente(cliente: ClientCreate, db: Session = Depends(get_db)):
    nuevo = Client(**cliente.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@app.put("/clients/{client_id}", response_model=ClientResponse, dependencies=SOLO_ADMIN)
def editar_cliente(client_id: int, cliente: ClientCreate, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Client, client_id, "Cliente")
    return actualizar(db, registro, cliente)


@app.delete("/clients/{client_id}", status_code=204, dependencies=SOLO_ADMIN)
def eliminar_cliente(client_id: int, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Client, client_id, "Cliente")
    bloquear_si_tiene(
        db, Appointment, Appointment.client_id, client_id,
        "No se puede eliminar: el cliente tiene {cantidad} cita(s) registrada(s).",
    )
    return eliminar(db, registro)


# PRODUCTOS DE CUIDADO

@app.get("/products", response_model=list[ProductResponse])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.asc()).all()


@app.post("/products", response_model=ProductResponse, status_code=201, dependencies=SOLO_ADMIN)
def crear_producto(
    producto: ProductCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    nuevo = Product(**producto.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    # Aviso a Slack en segundo plano (no retrasa la respuesta)
    background_tasks.add_task(enviar_slack, aviso_nuevo_producto(nuevo))
    return nuevo


@app.put("/products/{product_id}", response_model=ProductResponse, dependencies=SOLO_ADMIN)
def editar_producto(product_id: int, producto: ProductCreate, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Product, product_id, "Producto")
    return actualizar(db, registro, producto)


@app.delete("/products/{product_id}", status_code=204, dependencies=SOLO_ADMIN)
def eliminar_producto(product_id: int, db: Session = Depends(get_db)):
    registro = obtener_o_404(db, Product, product_id, "Producto")
    return eliminar(db, registro)


# DISEÑOS

@app.get("/designs", response_model=list[DesignResponse])
def listar_disenos(db: Session = Depends(get_db)):
    return db.query(Design).order_by(Design.id.desc()).all()


@app.post("/designs", response_model=DesignResponse, status_code=201, dependencies=SOLO_ADMIN)
def crear_diseno(diseno: DesignCreate, db: Session = Depends(get_db)):
    verificar_existe(db, Style, diseno.style_id, "Estilo")

    nuevo = Design(**diseno.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# CITAS

@app.get("/appointments", response_model=list[AppointmentResponse], dependencies=SOLO_ADMIN)
def listar_citas(db: Session = Depends(get_db)):
    return db.query(Appointment).order_by(
        Appointment.appointment_date.asc()
    ).all()


# Público: cualquier visitante puede reservar una cita
@app.post(
    "/appointments",
    response_model=AppointmentResponse,
    status_code=201,
)
def crear_cita(
    cita: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if cita.status not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="Estado de cita no válido",
        )

    verificar_existe(db, Client, cita.client_id, "Cliente")
    verificar_existe(db, Artist, cita.artist_id, "Tatuador")
    verificar_existe(db, Design, cita.design_id, "Diseño")

    nueva = Appointment(**cita.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    # Aviso a Slack en segundo plano (no retrasa la respuesta)
    background_tasks.add_task(enviar_slack, aviso_nueva_cita(nueva))
    return nueva


@app.patch(
    "/appointments/{appointment_id}/status",
    response_model=AppointmentResponse,
    dependencies=SOLO_ADMIN,
)
def actualizar_estado_cita(
    appointment_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    if status not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="Estado de cita no válido",
        )

    cita = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if cita is None:
        raise HTTPException(
            status_code=404,
            detail="Cita no encontrada",
        )

    cita.status = status
    db.commit()
    db.refresh(cita)
    return cita
