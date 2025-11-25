# Ejercicios de Estadística (Schaum)

## Ejercicio 1  
Variable discreta valores 1, 2, 3, 4: probabilidades 0.1, 0.3, 0.4, 0.2

- Fórmula:  
  ( P(X=x) = p_x )
- Resolución:  
  ( P(X=3) = 0.4 )

---

## Ejercicio 2  
Variable discreta valores 0, 1, 2, 3, 4: probabilidades 0.06, 0.19, 0.35, 0.24, 0.16

- Fórmula media:
  ( mu = sum x_i p_i )
- Cálculo:
  ( mu = 0\times0.06 + 1\times0.19 + 2\times0.35 + 3\times0.24 + 4\times0.16 = 0 + 0.19 + 0.7 + 0.72 + 0.64 = 2.25 )

- Fórmula varianza:
  ( sigma^2 = sum (x_i - mu)^2 p_i )
- Cálculo:
    - ( (0-2.25)^2\times0.06 = 5.0625\times0.06 = 0.30375 )
    - ( (1-2.25)^2\times0.19 = 1.5625\times0.19 = 0.29688 )
    - ( (2-2.25)^2\times0.35 = 0.0625\times0.35 = 0.02188 )
    - ( (3-2.25)^2\times0.24 = 0.5625\times0.24 = 0.135 )
    - ( (4-2.25)^2\times0.16 = 3.0625\times0.16 = 0.49 )
  ( sigma^2 = 0.30375+0.29688+0.02188+0.135+0.49 = 1.2475 )

---

## Ejercicio 3  
( X sim U(4,10) ), calcular ( P(6 < X < 8) )

- Fórmula densidad uniforme:
  ( f(x) = \frac{1}{b-a} = \frac{1}{10-4} = 0.1667 )
- Fórmula probabilidad:
  ( P(6 < X < 8) = f(x) \times (8-6) = 0.1667 \times 2 = 0.333 )

---

## Ejercicio 4  
Densidad continua ( f_X(x) = \frac{1}{8} ) para ( 0 < x < 6 ), calcular ( P(2 < X < 5) )

- Fórmula probabilidad:
  ( P(2 < X < 5) = int_2^5 \frac{1}{8} dx = \frac{1}{8}(5-2) = 0.375 )

---

## Ejercicio 5  
Binomial ( X sim Bin(8, 0.3) ), calcular ( P(X=3) )

- Fórmula binomial:
  ( P(X=k) = \binom{n}{k} p^k (1-p)^{n-k} )
  ( \binom{8}{3} = \frac{8!}{3!5!} = 56 )
  ( P(X=3) = 56 \times 0.3^3 \times 0.7^5 = 56 \times 0.027 \times 0.16807 = 56 \times 0.004538 = 0.254 )

---

## Ejercicio 6  
Binomial, lote 15 piezas, ( p = 0.12 ), calcular ( P(X=2) )

- Fórmula binomial:
  ( P(X=2) = \binom{15}{2} \times 0.12^2 \times 0.88^{13} )
  ( \binom{15}{2} = \frac{15!}{2!13!} = 105 )
  ( P(X=2) = 105 \times 0.0144 \times 0.1506 = 105 \times 0.002166 = 0.227 )

---

## Ejercicio 7  
Exponencial ( lambda=0.4 ), calcular ( P(T>5) )

- Fórmula:
  ( P(T>t) = e^{-lambda t} )
  ( P(T>5) = e^{-0.4 \times 5} = e^{-2} = 0.135 )

---

## Ejercicio 8  
Exponencial media 20, calcular ( P(T<8) )

- Parámetro:
  ( lambda = \frac{1}{20} = 0.05 )
- Fórmula:
  ( P(T<t) = 1 - e^{-lambda t} )
  ( P(T<8) = 1 - e^{-0.05 \times 8} = 1 - e^{-0.4} = 1 - 0.6703 = 0.3297 )

---

## Ejercicio 9  
Normal ( N(120, 15) ), calcular ( P(X>135) )

- Fórmula para ( Z ):
  ( Z = \frac{X-mu}{sigma} )
- Cálculo:
  ( Z = \frac{135-120}{15} = 1 )
- Probabilidad (tabla normal):
  ( P(Z>1) = 0.1587 )

---

## Ejercicio 10  
Normal ( N(300, 40) ), calcular ( P(250 < X < 360) )

- Fórmulas para ( Z_1, Z_2 ):
  ( Z_1 = \frac{250-300}{40} = -1.25 )
  ( Z_2 = \frac{360-300}{40} = 1.5 )
- Probabilidad (tabla normal):
  ( P(-1.25 < Z < 1.5) = P(Z < 1.5) - P(Z < -1.25) = 0.9332 - 0.1056 = 0.8276 )