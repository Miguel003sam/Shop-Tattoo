import os

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
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
    description="API para gestionar estilos, tatuadores, clientes, productos, diseños y citas",
    version="2.0.0",
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


def verificar_existe(db: Session, modelo, id_registro: int | None, nombre: str):
    if id_registro is not None and db.get(modelo, id_registro) is None:
        raise HTTPException(
            status_code=404,
            detail=f"{nombre} no encontrado",
        )


@app.get("/")
def inicio():
    return {"mensaje": "Sistema de Salón de Tatuajes funcionando"}


# ESTILOS

@app.get("/styles", response_model=list[StyleResponse])
def listar_estilos(db: Session = Depends(get_db)):
    return db.query(Style).order_by(Style.name.asc()).all()


@app.post("/styles", response_model=StyleResponse, status_code=201)
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


# TATUADORES

@app.get("/artists", response_model=list[ArtistResponse])
def listar_tatuadores(db: Session = Depends(get_db)):
    return db.query(Artist).order_by(Artist.full_name.asc()).all()


@app.post("/artists", response_model=ArtistResponse, status_code=201)
def crear_tatuador(tatuador: ArtistCreate, db: Session = Depends(get_db)):
    nuevo = Artist(**tatuador.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# CLIENTES

@app.get("/clients", response_model=list[ClientResponse])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.full_name.asc()).all()


@app.post("/clients", response_model=ClientResponse, status_code=201)
def crear_cliente(cliente: ClientCreate, db: Session = Depends(get_db)):
    nuevo = Client(**cliente.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# PRODUCTOS DE CUIDADO

@app.get("/products", response_model=list[ProductResponse])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.asc()).all()


@app.post("/products", response_model=ProductResponse, status_code=201)
def crear_producto(producto: ProductCreate, db: Session = Depends(get_db)):
    nuevo = Product(**producto.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# DISEÑOS

@app.get("/designs", response_model=list[DesignResponse])
def listar_disenos(db: Session = Depends(get_db)):
    return db.query(Design).order_by(Design.id.desc()).all()


@app.post("/designs", response_model=DesignResponse, status_code=201)
def crear_diseno(diseno: DesignCreate, db: Session = Depends(get_db)):
    verificar_existe(db, Style, diseno.style_id, "Estilo")

    nuevo = Design(**diseno.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# CITAS

@app.get("/appointments", response_model=list[AppointmentResponse])
def listar_citas(db: Session = Depends(get_db)):
    return db.query(Appointment).order_by(
        Appointment.appointment_date.asc()
    ).all()


@app.post(
    "/appointments",
    response_model=AppointmentResponse,
    status_code=201,
)
def crear_cita(
    cita: AppointmentCreate,
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
    return nueva


@app.patch(
    "/appointments/{appointment_id}/status",
    response_model=AppointmentResponse,
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
