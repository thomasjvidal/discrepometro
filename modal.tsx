import React, { useEffect, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Checkbox, FormControlLabel
} from '@mui/material'

type Tarefa = { titulo: string; feito: boolean }
type Transacao = {descricao: string; valor: number; tipo: 'entrada' | 'saida' }
type PerfilThomas = {
    nome: string
    hora: number
    estudouFaculdade: boolean
    blocoManha: Tarefa[]
    extrato: Transacao[]
    saldo: number
}

type ThomasModalProps = {
open: boolean
onClose: () => void
userId: string | null
}

export function ThomasModal({ open, onClose, userId }: ThomasModalProps) {
    return null
}