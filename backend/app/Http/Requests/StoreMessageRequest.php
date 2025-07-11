<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
    
    public function rules(): array
    {
        return [
            'message' => 'nullable|string',
            'receiver_id' => 'required_without:group_id|nullable|exists:users,id',
            'attachments' => 'nullable|array|max:10',
            'attachments.=' => 'file|max:1024000'
        ];
    }
}
