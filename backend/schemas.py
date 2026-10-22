
from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from datetime import datetime


# Esquemas para los estilos
class StyleCreate(BaseModel):
    name: str
    description: str | None = None


class StyleResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para los tatuadores
class ArtistCreate(BaseModel):
    full_name: str
    specialty: str | None = None
    phone: str | None = None


class ArtistResponse(BaseModel):
    id: int
    full_name: str
    specialty: str | None = None
    phone: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para los clientes
class ClientCreate(BaseModel):
    full_name: str
    phone: str | None = None
    email: str | None = None


class ClientResponse(BaseModel):
    id: int
    full_name: str
    phone: str | None = None
    email: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para los productos de cuidado
class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    price: Decimal = Field(ge=0)
    stock: int = Field(default=0, ge=0)
    image_url: str | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    stock: int
    image_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para los diseños
class DesignCreate(BaseModel):
    name: str
    style_id: int
    price: Decimal = Field(ge=0)
    image_url: str | None = None


class DesignResponse(BaseModel):
    id: int
    name: str
    style_id: int
    style: str | None = None
    price: Decimal
    image_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Esquemas para las citas
class AppointmentCreate(BaseModel):
    client_id: int
    artist_id: int | None = None
    design_id: int | None = None
    tattoo_description: str
    appointment_date: datetime
    price: Decimal = Field(ge=0)
    status: str = "pendiente"


class AppointmentResponse(BaseModel):
    id: int
    client_id: int
    client_name: str | None = None
    artist_id: int | None = None
    artist_name: str | None = None
    design_id: int | None = None
    design_name: str | None = None
    tattoo_description: str
    appointment_date: datetime
    price: Decimal
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
