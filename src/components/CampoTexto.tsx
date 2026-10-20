import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colores, borde, espacio } from '../theme';

const CampoTexto = forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => {
    const [focus, setFocus] = useState(false);
    return (
        <TextInput
            {...props}
            ref={ref}
            style={[styles.input, focus && styles.inputFocus, style]}
            placeholderTextColor={colores.gris}
            onFocus={(e) => { 
                props.onFocus?.(e); 
                setFocus(true); 
            }}
            onBlur={(e) => { 
                props.onBlur?.(e); 
                setFocus(false); 
            }}
        />
    );
});
const styles = StyleSheet.create({
    input: { 
        backgroundColor: colores.asfaltoClaro, 
        color: colores.hueso, 
        padding: espacio.m, 
        marginBottom: espacio.m, 
        borderWidth: borde.grosor, 
        borderColor: colores.gris 
    },
    inputFocus: { 
        borderColor: colores.hueso 
    }
});

export default CampoTexto;