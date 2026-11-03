<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('short_description');
            $table->string('role');
            $table->string('client')->nullable();
            $table->unsignedSmallInteger('year');
            $table->string('duration')->nullable();
            $table->json('tools')->nullable();
            $table->longText('problem')->nullable();
            $table->longText('process')->nullable();
            $table->longText('solution')->nullable();
            $table->longText('outcome')->nullable();
            $table->string('cover_image')->nullable();
            $table->json('gallery')->nullable();
            $table->string('live_url')->nullable();
            $table->string('repo_url')->nullable();
            $table->string('figma_url')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_published')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
