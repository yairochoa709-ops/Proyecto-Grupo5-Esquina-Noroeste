# Suite de Investigación de Operaciones

Una potente aplicación de escritorio diseñada para resolver, visualizar y aprender sobre diversos problemas de Investigación de Operaciones. Desarrollada por el **Proyecto Grupo 5**, esta suite ofrece un enfoque pedagógico mostrando la resolución paso a paso de cada modelo matemático y generando reportes detallados en PDF.

## 🚀 Características Principales

La aplicación cuenta con 6 módulos principales que abarcan distintas ramas de la Investigación de Operaciones:

1. **Transporte (Esquina Noroeste)**: Resolución paso a paso de matrices de transporte (oferta y demanda), auto-balanceo lógico, degeneración y trazado de rutas.
2. **Análisis de Redes (PERT / CPM)**: Trazado interactivo del diagrama de red, cálculo de tiempos más tempranos (Holguras), tiempos más tardíos, identificación de la ruta crítica y varianza del proyecto.
3. **Programación Dinámica**: Resolución del clásico Problema de la Diligencia utilizando recursión hacia atrás de Bellman para encontrar la ruta de menor costo.
4. **Teoría de Colas**:
   - **Cadenas de Markov**: Cálculo de probabilidades de estado estable y dibujado exacto del diagrama de transición de estados.
   - **Nacimiento y Muerte**: Cálculo de parámetros operativos de los sistemas de espera ($\rho, L, L_q, W, W_q$).
5. **Inventarios**: Cálculos para los modelos determinísticos y probabilísticos (EOQ, POQ, Descuentos por cantidad), incluyendo gráficas interactivas del comportamiento del inventario en el tiempo.
6. **Teoría de Decisiones**: Toma de decisiones bajo incertidumbre y riesgo utilizando matrices de pagos y aplicando los criterios de Laplace, Optimista, Pesimista, Hurwicz, Savage, y Valor Esperado.

### 🌟 Funcionalidades Transversales
- **Generador Automático de Ejercicios**: Crea problemas y contextos aleatorios equilibrados o desequilibrados con un solo clic para estudiar.
- **Resolución Paso a Paso**: Interfaz interactiva para avanzar o retroceder en el algoritmo, mostrando qué operación matemática se realiza en cada iteración.
- **Modo Manual**: Ingresa tus propias matrices, grafos o parámetros personalizados.
- **Exportación a PDF**: Generación de reportes profesionales en formato PDF con la resolución completa, fórmulas matemáticas renderizadas y los diagramas gráficos incrustados.

---

## 🛠 Tecnologías Utilizadas

Esta suite está construida utilizando tecnologías modernas de desarrollo web integradas en una aplicación de escritorio nativa:

- **[Electron](https://www.electronjs.org/)**: Framework para empaquetar la aplicación de escritorio multiplataforma (Windows/Mac/Linux).
- **[React 19](https://react.dev/)**: Librería para la construcción de la Interfaz de Usuario.
- **[Vite](https://vitejs.dev/)**: Herramienta de construcción (*bundler*) ultra-rápida.
- **Visualización y Gráficos**:
  - `recharts` para las gráficas cartesianas (Inventarios).
  - Motores de dibujo SVG propios diseñados desde cero para graficar Cadenas de Markov, Rutas Críticas y Esquina Noroeste.
- **Generación de Reportes**:
  - `jspdf` y `jspdf-autotable` para construir la estructura del documento.
  - `html2canvas` para incrustar gráficos complejos.
  - `katex` y `react-katex` para la renderización matemática impecable de fórmulas tanto en la interfaz como en el PDF.

---

## ⚙️ Cómo clonar y ejecutar en desarrollo

Para trabajar en este repositorio y ejecutar la aplicación en tu entorno local, asegúrate de tener instalado [Node.js](https://nodejs.org/) (se recomienda v18 o superior).

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/yairochoa709-ops/Proyecto-Grupo5-Esquina-Noroeste.git
   cd Proyecto-Grupo5-Esquina-Noroeste/men-desktop
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   Este comando levantará Vite e iniciará la ventana de Electron de forma paralela.
   ```bash
   npm run dev
   ```

## 📦 Empaquetado para Producción

Para compilar y generar el instalador final (`.exe` para Windows):

```bash
npm run build
```

Una vez finalizado el proceso, el instalador autoejecutable se encontrará dentro de la carpeta `men-desktop/dist-electron/` (el nombre y ruta exacta puede depender del sistema operativo en el que se construya).

---

## 🤝 Contribuciones
¡Cualquier aporte, corrección de errores (bugs) o mejora en la interfaz es bienvenido! Si deseas contribuir, por favor haz un *fork* del repositorio y crea un *Pull Request* con tus cambios.
