@echo off
cd /d "%~dp0"
echo ========================================
echo Exportando archivos .scss del proyecto...
echo ========================================
echo.

:: Configurar variables
set OUTPUT_FILE=exportacion_scss_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt
set OUTPUT_FILE=%OUTPUT_FILE: =0%

echo Generando archivo: %OUTPUT_FILE%
echo.

:: Crear encabezado
echo ======================================== > %OUTPUT_FILE%
echo EXPORTACION DE ARCHIVOS .SCSS >> %OUTPUT_FILE%
echo ======================================== >> %OUTPUT_FILE%
echo Fecha: %date% %time% >> %OUTPUT_FILE%
echo Proyecto: %CD% >> %OUTPUT_FILE%
echo ======================================== >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo Procesando archivos...

:: Carpeta src
if exist src (
    echo.
    echo ==================== ARCHIVOS .SCSS EN src/ ==================== >> %OUTPUT_FILE%
    echo. >> %OUTPUT_FILE%

    for /R src %%f in (*.scss) do (
        echo Procesando: %%f
        echo. >> %OUTPUT_FILE%
        echo ==================== %%f ==================== >> %OUTPUT_FILE%
        type "%%f" >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
    )
)

:: Carpeta components (por si está fuera de src)
if exist components (
    echo.
    echo ==================== ARCHIVOS .SCSS EN components/ ==================== >> %OUTPUT_FILE%
    echo. >> %OUTPUT_FILE%

    for /R components %%f in (*.scss) do (
        echo Procesando: %%f
        echo. >> %OUTPUT_FILE%
        echo ==================== %%f ==================== >> %OUTPUT_FILE%
        type "%%f" >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
    )
)

echo.
echo ======================================== >> %OUTPUT_FILE%
echo FIN DE LA EXPORTACION >> %OUTPUT_FILE%
echo ======================================== >> %OUTPUT_FILE%

echo.
echo ========================================
echo ¡Exportacion completada!
echo Archivo generado: %OUTPUT_FILE%
echo ========================================
pause