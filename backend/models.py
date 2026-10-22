
from sqlalchemy import (
    Column, BigInteger, Integer, Text, Numeric,
    DateTime, ForeignKey, text
)
from sqlalchemy.orm import relationship
from database import Base


class Style(Base):
    __tablename__ = "styles"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()")
    )


class Artist(Base):
    __tablename__ = "artists"

    id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(Text, nullable=False)
    specialty = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()")
    )


class Client(Base):
    __tablename__ = "clients"

    id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(Text, nullable=False)
    phone = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()")
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, server_default=text("0"))
    image_url = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()")
    )


class Design(Base):
    __tablename__ = "designs"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    style_id = Column(BigInteger, ForeignKey("styles.id"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()")
    )

    style_rel = relationship("Style", lazy="joined")

    # Nombre del estilo, para mostrarlo directamente en el frontend
    @property
    def style(self):
        return self.style_rel.name if self.style_rel else None


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(BigInteger, primary_key=True, index=True)
    client_id = Column(BigInteger, ForeignKey("clients.id"), nullable=False)
    artist_id = Column(BigInteger, ForeignKey("artists.id"), nullable=True)
    design_id = Column(BigInteger, ForeignKey("designs.id"), nullable=True)
    tattoo_description = Column(Text, nullable=False)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    status = Column(Text, nullable=False, server_default=text("'pendiente'"))
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()")
    )

    client = relationship("Client", lazy="joined")
    artist = relationship("Artist", lazy="joined")
    design = relationship("Design", lazy="joined")

    # Nombres relacionados, para mostrarlos en la tabla de citas
    @property
    def client_name(self):
        return self.client.full_name if self.client else None

    @property
    def artist_name(self):
        return self.artist.full_name if self.artist else None

    @property
    def design_name(self):
        return self.design.name if self.design else None
