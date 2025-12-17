'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Braces, Copy, Check } from 'lucide-react';
import { extractVariables, fillVariables, type Prompt } from '@/lib/prompt-library/types';
import { toast } from 'sonner';

interface VariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt;
}

export function VariableDialog({ open, onOpenChange, prompt }: VariableDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const variables = extractVariables(prompt.content);

  // Reset values when dialog opens
  useEffect(() => {
    if (open) {
      setValues({});
      setCopied(false);
    }
  }, [open]);

  const handleValueChange = (varName: string, value: string) => {
    setValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleCopy = () => {
    const result = fillVariables(prompt.content, values);
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Prompt copié avec les variables remplies');
    setTimeout(() => {
      setCopied(false);
      onOpenChange(false);
    }, 1000);
  };

  const preview = fillVariables(prompt.content, values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Braces className="h-5 w-5" />
            Remplir les variables
          </DialogTitle>
          <DialogDescription>
            Entrez les valeurs pour les variables de ce prompt avant de le copier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Variable inputs */}
          <div className="grid gap-4">
            {variables.map((variable) => (
              <div key={variable} className="grid gap-2">
                <Label htmlFor={variable} className="font-mono text-sm">
                  {`{{${variable}}}`}
                </Label>
                <Input
                  id={variable}
                  placeholder={`Entrez la valeur pour ${variable}...`}
                  value={values[variable] || ''}
                  onChange={(e) => handleValueChange(variable, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Aperçu</Label>
            <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {preview}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
