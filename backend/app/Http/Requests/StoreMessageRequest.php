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
            'receiver_id' => 'required|nullable|exists:users,id',
            'attachments' => 'nullable|array|max:10',
            //'attachments.*' => 'file|max:10240000|mimes:jpeg,jpg,png,gif,bmp,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,mp4,avi,mov,wmv,mp3,wav,aac'
            'attachments.*' => 'file|max:10240000|mimes:jpeg,jpg,png,pdf,doc,docx,xls,xlsx,ppt,pptx,txt'
        ];
    }
}
