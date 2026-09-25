# Walkthrough 004: Visibilidad y Acceso Completo de Enlaces del Menú de Navegación para SuperAdmin

## 1. Resumen de la Entrega
Se resolvió la incidencia donde el usuario `SuperAdmin` no podía visualizar todos los enlaces en el menú de navegación lateral (`app-sidebar`).

### Causa Raíz
Los enlaces de **"Agenda y Citas"**, **"Estudios y Laboratorio"** y **"Catálogo de Estudios"** estaban condicionados estrictamente a los feature flags de la empresa activa (`companyService.hasScheduling()` y `companyService.hasLaboratory()`). Dado que las clínicas demo en base de datos tienen `MODULE_LABORATORY = False`, dichos enlaces permanecían ocultos para el `SuperAdmin`, y el guardia de ruta (`moduleGuard`) bloqueaba su ingreso si se intentaba acceder por URL directa.

### Solución Implementada
1. **Visibilidad Incondicional para SuperAdmin en `ShellComponent`:**
   - Se actualizaron las directivas `@if` en la barra lateral para verificar `authService.isSuperAdmin()`, garantizando que el SuperAdmin siempre visualice los módulos de Citas, Laboratorio y el Catálogo de Estudios, independientemente del estado de los feature flags de la empresa tenant activa.
2. **Bypass en `moduleGuard`:**
   - Se añadió la verificación de `authService.isSuperAdmin()` en el guardia funcional `moduleGuard`, permitiendo al SuperAdmin navegar a cualquier módulo sin restricciones de tenant.

---

## 2. Matriz de Archivos Afectados

| Capa | Archivo | Acción | Descripción |
| :--- | :--- | :---: | :--- |
| **Frontend - Layout** | [`frontend/src/app/layout/shell.component.ts`](file:///c:/Erab/frontend/src/app/layout/shell.component.ts) | **MODIFICADO** | Agrega `authService.isSuperAdmin()` a los condicionales de Agenda, Estudios y Catálogo de Estudios. |
| **Frontend - Guards** | [`frontend/src/app/core/guards/module.guard.ts`](file:///c:/Erab/frontend/src/app/core/guards/module.guard.ts) | **MODIFICADO** | Permite el acceso irrestricto si el usuario tiene el rol `SuperAdmin`. |

---

## 3. Evidencias de Pruebas

### 3.1. Pruebas Backend (`dotnet test backend/MedApp.slnx`)
```text
Serie de pruebas para C:\Erab\backend\MedApp.Tests\bin\Debug\net10.0\MedApp.Tests.dll (.NETCoreApp,Version=v10.0)
1 archivos de prueba en total coincidieron con el patrón especificado.

Correctas! - Con error:     0, Superado:    29, Omitido:     0, Total:    29, Duración: 7 s - MedApp.Tests.dll (net10.0)
```

### 3.2. Compilación Frontend (`npx ng build`)
```text
> Building...
√ Building...
Initial chunk files | Names                         |  Raw size | Estimated transfer size
chunk-UCOZGMFM.js   | -                             | 244.34 kB |                66.21 kB
chunk-VBTF2RRG.js   | -                             |  89.88 kB |                22.68 kB
main-DWJTGYKE.js    | main                          |  61.52 kB |                13.25 kB
styles-4U3XOSXY.css | styles                        |  42.94 kB |                 7.28 kB
chunk-L5GB2VNJ.js   | -                             |   3.90 kB |                 1.10 kB
chunk-TYIOK6YQ.js   | -                             |   1.98 kB |               727 bytes
chunk-HVMKA4LW.js   | -                             | 772 bytes |               772 bytes

Application bundle generation complete. [5.727 seconds] - 2026-09-25T17:08:39.955Z
Output location: C:\Erab\frontend\dist\frontend
```

---

## 4. Guía de Verificación Manual para el Usuario

1. Iniciar sesión como `admin` (`admin123`).
2. Seleccionar cualquier empresa en `/select-company` (por ejemplo `Clínica Central Demo`).
3. Revisar el menú lateral izquierdo:
   - **General:**
     - Inicio (`/dashboard`)
   - **Clínica y Operaciones:**
     - Pacientes (`/patients`)
     - Agenda y Citas (`/scheduling`) *(ahora visible)*
     - Estudios y Laboratorio (`/studies`) *(ahora visible)*
   - **Administración:**
     - Catálogo de Estudios (`/studies/catalog`) *(ahora visible)*
     - Empresas (`/companies`)
     - Áreas (`/areas`)
     - Especialidades (`/specialties`)
     - Empleados (`/employees`)
     - Procedimientos (`/interventions`)
     - Usuarios (`/users`)
     - Trazabilidad / Auditoría (`/audit-logs`)
4. Hacer clic en **Catálogo de Estudios** y en **Estudios y Laboratorio**: se accederá a las pantallas de gestión sin ningún bloqueo de `moduleGuard`.
