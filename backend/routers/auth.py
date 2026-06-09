from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from database import get_pool
from models import UserLogin, Token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Konfigurasi JWT & Hashing
SECRET_KEY = "ganti_dengan_secret_key_yang_sangat_rahasia_dan_panjang"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 Jam

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    pool = await get_pool()
    
    # Cari user di database
    query = "SELECT * FROM users WHERE email = $1"
    user = await pool.fetchrow(query, user_data.email)
    
    if not user or user_data.password != user['hashed_password']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Buat Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email']}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}